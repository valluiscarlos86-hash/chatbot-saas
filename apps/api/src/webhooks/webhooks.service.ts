import { Injectable, Inject } from '@nestjs/common'
import { Webhook } from 'svix'
import { DATABASE_CONNECTION } from '../database/database.module'
import { sql } from 'drizzle-orm'
import axios from 'axios'

@Injectable()
export class WebhooksService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
  ) {}

  async handleClerkEvent(headers: Record<string, string>, body: any) {
    const secret = process.env.CLERK_WEBHOOK_SECRET!
    const wh = new Webhook(secret)
    const payload = JSON.stringify(body)

    const evt = wh.verify(payload, {
      'svix-id': headers['svix-id'],
      'svix-timestamp': headers['svix-timestamp'],
      'svix-signature': headers['svix-signature'],
    }) as any

    if (evt.type === 'user.created') {
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 7)

      await this.db.execute(sql`
        INSERT INTO organizations (clerk_user_id, name, email, is_trial, trial_ends_at)
        VALUES (
          ${evt.data.id},
          ${evt.data.email_addresses[0].email_address.split('@')[0]},
          ${evt.data.email_addresses[0].email_address},
          true,
          ${trialEndsAt.toISOString()}
        )
      `)
    }

    return { received: true }
  }

  verifyWhatsapp(mode: string, token: string, challenge: string): string {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook de WhatsApp verificado correctamente')
      return challenge
    }
    throw new Error('Token de verificación inválido')
  }

  async handleWhatsappEvent(body: any) {
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const message = changes?.value?.messages?.[0]

    if (!message) return { received: true }

    const from = message.from
    const text = message.text?.body

    console.log(`Mensaje de ${from}: ${text}`)

    await this.sendWhatsappMessage(from, `¡Hola! Recibí tu mensaje: "${text}". Pronto te responderé con IA. 🤖`)

    return { received: true }
  }

  async sendWhatsappMessage(to: string, message: string) {
    const token = process.env.WHATSAPP_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    try {
      await axios.post(
        `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      console.log(`Mensaje enviado a ${to}`)
    } catch (error) {
    console.error('Error enviando mensaje:', (error as any)?.response?.data)
    }
  }
}