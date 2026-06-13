import { Controller, Get, Post, Patch, Param, Query, Body, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { AiService } from '../ai.service';
import { sql } from 'drizzle-orm';
import axios from 'axios';

const SYSTEM_LOG: Record<string, string> = {
  human_takeover: 'Conversación tomada por un agente',
  bot_active: 'Bot reactivado',
  closed: 'Conversación cerrada',
};

@Controller('conversations')
export class ConversationsController {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    private aiService: AiService,
  ) {}

  @Get()
  async listConversations(@Query('orgId') orgId: string) {
    if (!orgId) return [];

    const result = await this.db.execute(sql`
      SELECT
        c.id,
        c.customer_phone,
        c.customer_name,
        c.status,
        c.updated_at,
        c.created_at,
        c.metadata,
        m.content AS last_message,
        m.role    AS last_message_role
      FROM conversations c
      LEFT JOIN LATERAL (
        SELECT content, role
        FROM messages
        WHERE conversation_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) m ON true
      WHERE c.org_id = ${orgId}
      ORDER BY c.updated_at DESC
      LIMIT 50
    `);

    return result.rows || result;
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
  ) {
    if (!orgId) return [];

    const result = await this.db.execute(sql`
      SELECT id, role, content, created_at
      FROM messages
      WHERE conversation_id = ${id}
        AND org_id = ${orgId}
      ORDER BY created_at ASC
    `);

    return result.rows || result;
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; orgId: string },
  ) {
    const { status, orgId } = body;
    if (!SYSTEM_LOG[status] || !orgId) return { error: 'Parámetros inválidos' };

    const check = await this.db.execute(sql`
      SELECT id FROM conversations WHERE id = ${id} AND org_id = ${orgId} LIMIT 1
    `);
    const checkRows = check.rows || check;
    if (!(checkRows as any[])[0]) return { error: 'Conversación no encontrada' };

    await this.db.execute(sql`
      UPDATE conversations
      SET status = ${status}::conversation_status, updated_at = NOW()
      WHERE id = ${id}
    `);

    await this.db.execute(sql`
      INSERT INTO messages (conversation_id, org_id, role, content)
      VALUES (${id}, ${orgId}, 'system', ${SYSTEM_LOG[status]})
    `);

    return { success: true, status };
  }

  @Post(':id/agent-message')
  async sendAgentMessage(
    @Param('id') id: string,
    @Body() body: { content: string; orgId: string },
  ) {
    const { content, orgId } = body;
    if (!content || !orgId) return { error: 'Parámetros inválidos' };

    const check = await this.db.execute(sql`
      SELECT id, customer_phone, status FROM conversations
      WHERE id = ${id} AND org_id = ${orgId} LIMIT 1
    `);
    const checkRows = check.rows || check;
    const conv = (checkRows as any[])[0];
    if (!conv) return { error: 'Conversación no encontrada' };
    if (conv.status !== 'human_takeover') return { error: 'La conversación no está en modo humano' };

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    try {
      await axios.post(
        `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: conv.customer_phone,
          type: 'text',
          text: { body: content },
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      );
    } catch (error) {
      console.error('Error enviando mensaje del agente:', (error as any)?.response?.data);
      return { error: 'Error enviando el mensaje por WhatsApp' };
    }

    const inserted = await this.db.execute(sql`
      INSERT INTO messages (conversation_id, org_id, role, content)
      VALUES (${id}, ${orgId}, 'assistant', ${content})
      RETURNING id, role, content, created_at
    `);
    const insertedRows = inserted.rows || inserted;

    await this.db.execute(sql`
      UPDATE conversations SET updated_at = NOW() WHERE id = ${id}
    `);

    return (insertedRows as any[])[0];
  }

  @Post(':id/summary')
  async generateSummary(
    @Param('id') id: string,
    @Body() body: { orgId: string },
  ) {
    const { orgId } = body;
    if (!orgId) return { error: 'orgId requerido' };

    const check = await this.db.execute(sql`
      SELECT id FROM conversations WHERE id = ${id} AND org_id = ${orgId} LIMIT 1
    `);
    const checkRows = check.rows || check;
    if (!(checkRows as any[])[0]) return { error: 'Conversación no encontrada' };

    const result = await this.db.execute(sql`
      SELECT role, content
      FROM messages
      WHERE conversation_id = ${id}
        AND role IN ('user', 'assistant')
      ORDER BY created_at ASC
    `);
    const rows = result.rows || result;
    const messages = rows as Array<{ role: 'user' | 'assistant'; content: string }>;

    if (messages.length === 0) {
      return { summary: 'No hay suficiente contenido para resumir.' };
    }

    try {
      const summary = await this.aiService.generateSummary(messages);
      return { summary };
    } catch {
      return { summary: 'No se pudo generar el resumen. Intentá de nuevo.' };
    }
  }

  @Patch(':id/metadata')
  async updateMetadata(
    @Param('id') id: string,
    @Body() body: { orgId: string; internal_note: string },
  ) {
    const { orgId, internal_note } = body;
    if (!orgId) return { error: 'orgId requerido' };

    await this.db.execute(sql`
      UPDATE conversations
      SET metadata = metadata || ${JSON.stringify({ internal_note })}::jsonb
      WHERE id = ${id} AND org_id = ${orgId}
    `);

    return { success: true };
  }
}
