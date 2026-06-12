import { Controller, Get, Param, Query, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { sql } from 'drizzle-orm';

@Controller('conversations')
export class ConversationsController {
  constructor(@Inject(DATABASE_CONNECTION) private db: any) {}

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
}
