import { Injectable, Inject } from '@nestjs/common'
import { Webhook } from 'svix'
import { DATABASE_CONNECTION } from '../database/database.module'
import { sql } from 'drizzle-orm'
import axios from 'axios'
import { AiService } from '../ai.service'

// Texto legible de cada motivo, para la nota que lee el agente humano.
const MOTIVOS_DERIVACION: Record<string, string> = {
  pedido_explicito: 'el cliente pidió hablar con una persona',
  sin_informacion: 'el asistente no tenía información para responder',
  excepcion_a_politica: 'la consulta requiere una excepción a las políticas del negocio',
  reclamo: 'el cliente expresó un reclamo',
  error_tecnico: 'falló la generación automática de respuestas',
  otro: 'otro motivo',
}

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
    const phoneNumberId = changes?.value?.metadata?.phone_number_id || 'unknown'
    const contactName: string | null = changes?.value?.contacts?.[0]?.profile?.name ?? null

    if (!text) return { received: true }

    console.log(`Mensaje de ${from} (${contactName ?? 'sin nombre'}): ${text}`)

    // 1 — Buscar la organización dueña de este número de WhatsApp
    const configResult = await this.db.execute(sql`
      SELECT
        wa.org_id,
        wa.id as whatsapp_account_id,
        cc.bot_name,
        cc.bot_tone,
        cc.business_name,
        cc.business_description,
        cc.escalation_rules,
        cc.office_hours
      FROM whatsapp_accounts wa
      LEFT JOIN chatbot_configs cc ON cc.org_id = wa.org_id
      WHERE wa.phone_number_id = ${phoneNumberId} AND wa.is_active = true
      LIMIT 1
    `)
    const configRows = configResult.rows || configResult
    const config = (configRows as any[])?.[0]

    if (!config?.org_id) {
      console.warn(`Mensaje de WhatsApp recibido para phone_number_id desconocido: ${phoneNumberId} — descartado`)
      return { received: true }
    }
    const orgId = config.org_id
    const whatsappAccountId = config.whatsapp_account_id

    // 3 — Upsert conversation: una sola conversación por org_id + customer_phone
    const convResult = await this.db.execute(sql`
      SELECT id, status FROM conversations
      WHERE org_id = ${orgId} AND customer_phone = ${from}
      ORDER BY created_at DESC
      LIMIT 1
    `)
    const convRows = convResult.rows || convResult
    const existingConv = (convRows as any[])[0]
    let conversationId = existingConv?.id
    let conversationStatus: string = existingConv?.status ?? 'bot_active'

    if (!conversationId) {
      const insertConv = await this.db.execute(sql`
        INSERT INTO conversations (org_id, whatsapp_account_id, customer_phone, customer_name, status)
        VALUES (${orgId}, ${whatsappAccountId}, ${from}, ${contactName}, 'bot_active')
        RETURNING id
      `)
      const insertConvRows = insertConv.rows || insertConv
      conversationId = (insertConvRows as any[])[0]?.id
      conversationStatus = 'bot_active'
    } else if (conversationStatus === 'closed') {
      // Reabrir conversación cerrada en vez de crear una nueva, preservando el historial
      await this.db.execute(sql`
        UPDATE conversations
        SET status = 'bot_active',
            updated_at = NOW(),
            customer_name = COALESCE(customer_name, ${contactName})
        WHERE id = ${conversationId}
      `)
      await this.db.execute(sql`
        INSERT INTO messages (conversation_id, org_id, role, content)
        VALUES (${conversationId}, ${orgId}, 'system', 'Conversación reabierta')
      `)
      conversationStatus = 'bot_active'
    } else {
      // Actualizar updated_at y rellenar customer_name solo si todavía es NULL
      await this.db.execute(sql`
        UPDATE conversations
        SET updated_at = NOW(),
            customer_name = COALESCE(customer_name, ${contactName})
        WHERE id = ${conversationId}
      `)
    }

    // Handoff: si la conversación está tomada por un agente, solo guardar el mensaje
    if (conversationStatus === 'human_takeover') {
      console.log(`Conversación ${conversationId} en human_takeover — guardando mensaje sin responder`)
      await this.db.execute(sql`
        INSERT INTO messages (conversation_id, org_id, role, content)
        VALUES (${conversationId}, ${orgId}, 'user', ${text})
      `)
      return { received: true }
    }

    // 4 — Buscar historial de conversación (solo para bot_active)
    const historyResult = await this.db.execute(sql`
      SELECT role, content
      FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
      LIMIT 10
    `)
    const conversationHistory = (historyResult.rows || []).map((row: any) => ({
      role: row.role as 'user' | 'assistant',
      content: row.content,
    }))

    // 5 — Armar config del chatbot
    const chatbotConfig = {
      botName: config.bot_name || 'Asistente',
      tone: config.bot_tone || 'amigable',
      language: 'español',
      systemPrompt: config.business_description
        ? `Sos el asistente de ${config.business_name || 'esta empresa'}. ${config.business_description}. ${config.escalation_rules ? 'Reglas de escalada: ' + config.escalation_rules : ''}`
        : 'Sos un asistente de atención al cliente. Respondé de forma amigable y concisa.',
      officeHours: config.office_hours || undefined,
    }

    // 6 — Llamar a OpenAI con RAG
    let aiResponse: string
    let handoff: { motivo: string; resumen: string } | null = null
    try {
      const reply = await this.aiService.generateResponse(
        text,
        chatbotConfig,
        conversationHistory,
        orgId,
      )
      aiResponse = reply.response
      handoff = reply.handoff
    } catch (error) {
      console.error('Error al llamar a OpenAI:', error)
      aiResponse = 'Lo siento, estoy teniendo dificultades técnicas. Un agente te contactará pronto.'
      handoff = {
        motivo: 'error_tecnico',
        resumen: 'La generación automática de respuestas falló. La conversación se deriva para que una persona la atienda.',
      }
    }

    // 7 — Guardar mensaje entrante (user)
    await this.db.execute(sql`
      INSERT INTO messages (conversation_id, org_id, role, content)
      VALUES (${conversationId}, ${orgId}, 'user', ${text})
    `)

    // 8 — Enviar por WhatsApp y guardar respuesta (assistant)
    await this.sendWhatsappMessage(from, aiResponse, whatsappAccountId)
    await this.db.execute(sql`
      INSERT INTO messages (conversation_id, org_id, role, content)
      VALUES (${conversationId}, ${orgId}, 'assistant', ${aiResponse})
    `)

    // 9 — Derivación a una persona, si el asistente la pidió.
    // El cambio de estado lo hace el código, no el texto del modelo: a partir
    // de acá el bot deja de responder esta conversación (ver el paso 3).
    if (handoff) {
      await this.db.execute(sql`
        UPDATE conversations
        SET status = 'human_takeover', updated_at = now()
        WHERE id = ${conversationId}
      `)

      // La nota de traspaso se guarda como mensaje 'system': es el canal
      // interno que ya usa el panel y no se le envía al cliente.
      const motivo = MOTIVOS_DERIVACION[handoff.motivo] || handoff.motivo
      const nota = `Derivada automáticamente por el asistente.\nMotivo: ${motivo}.\n${handoff.resumen}`
      await this.db.execute(sql`
        INSERT INTO messages (conversation_id, org_id, role, content)
        VALUES (${conversationId}, ${orgId}, 'system', ${nota})
      `)
      console.log(`Conversación ${conversationId} derivada automáticamente (${handoff.motivo})`)
    }

    return { received: true }
  }

  async sendWhatsappMessage(to: string, message: string, whatsappAccountId: string) {
    const waResult = await this.db.execute(sql`
      SELECT access_token, phone_number_id FROM whatsapp_accounts WHERE id = ${whatsappAccountId} LIMIT 1
    `)
    const waRows = waResult.rows || waResult
    const wa = (waRows as any[])[0]

    if (!wa) {
      console.error(`No se encontraron credenciales de WhatsApp para whatsapp_account_id ${whatsappAccountId}`)
      return
    }

    try {
      await axios.post(
        `https://graph.facebook.com/v22.0/${wa.phone_number_id}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${wa.access_token}`,
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