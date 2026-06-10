import { Injectable, Inject } from '@nestjs/common'
import { Webhook } from 'svix'
import { DATABASE_CONNECTION } from '../database/database.module'
import { sql } from 'drizzle-orm'
import axios from 'axios'
import { AiService } from '../ai.service'

@Injectable()
export class WebhooksService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    private aiService: AiService,
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
    if (message.type !== 'text') return { received: true }

    const from = message.from
    const text = message.text?.body

    if (!text) return { received: true }

    console.log(`Mensaje de ${from}: ${text}`)

    try {
      // 1 — Buscar la organización y su config de chatbot
      const configResult = await this.db.execute(sql`
        SELECT 
          o.id as org_id,
          cc.bot_name,
          cc.bot_tone,
          cc.business_name,
          cc.business_description,
          cc.welcome_message,
          cc.escalation_rules
        FROM organizations o
        LEFT JOIN chatbot_configs cc ON cc.org_id = o.id
        LIMIT 1
      `)

const configRows = configResult.rows || configResult
      const config = (configRows as any[])?.[0]
      

// 2 — Buscar historial de conversación (solo si tenemos org_id)
let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []

if (config?.org_id) {
  const historyResult = await this.db.execute(sql`
    SELECT role, content
    FROM messages
    WHERE conversation_id IN (
      SELECT id FROM conversations
      WHERE org_id = ${config.org_id}
      AND customer_phone = ${from}
      ORDER BY created_at DESC
      LIMIT 1
    )
    ORDER BY created_at ASC
    LIMIT 10
  `)

  conversationHistory = (historyResult.rows || []).map((row: any) => ({
    role: row.role as 'user' | 'assistant',
    content: row.content,
  }))
}

      // 3 — Armar config del chatbot con los nombres reales de columnas
      const chatbotConfig = {
        botName: config?.bot_name || 'Asistente',
        tone: config?.bot_tone || 'amigable',
        language: 'español',
        systemPrompt: config?.business_description
          ? `Sos el asistente de ${config.business_name || 'esta empresa'}. ${config.business_description}. ${config.escalation_rules ? 'Reglas de escalada: ' + config.escalation_rules : ''}`
          : 'Sos un asistente de atención al cliente. Respondé de forma amigable y concisa.',
      }

      // 4 — Llamar a OpenAI (con búsqueda en documentos del negocio)
      const aiResponse = await this.aiService.generateResponse(
        text,
        chatbotConfig,
        conversationHistory,
        config?.org_id,
      )

      // 5 — Enviar respuesta por WhatsApp
      await this.sendWhatsappMessage(from, aiResponse)

    } catch (error) {
      console.error('Error procesando mensaje:', error)
      await this.sendWhatsappMessage(
        from,
        'Lo siento, estoy teniendo dificultades técnicas. Un agente te contactará pronto.'
      )
    }

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