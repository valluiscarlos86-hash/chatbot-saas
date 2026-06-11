import { Controller, Post, Body, Inject, Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { DATABASE_CONNECTION } from './database/database.module';
import { sql } from 'drizzle-orm';

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private aiService: AiService,
    @Inject(DATABASE_CONNECTION) private db: any,
  ) {}

  @Post('test-chat')
  async testChat(@Body() body: { message: string; orgId: string }) {
    const { message, orgId } = body;

    if (!message || !orgId) {
      return { error: 'message y orgId son requeridos' };
    }

    const configResult = await this.db.execute(sql`
      SELECT bot_name, bot_tone, business_name, business_description, escalation_rules
      FROM chatbot_configs
      WHERE org_id = ${orgId}
      LIMIT 1
    `);

    const rows = configResult.rows || configResult;
    const config = (rows as any[])[0];

    const chatbotConfig = {
      botName: config?.bot_name || 'Asistente',
      tone: config?.bot_tone || 'friendly',
      language: 'español',
      systemPrompt: config?.business_description
        ? `Sos el asistente de ${config.business_name || 'esta empresa'}. ${config.business_description}. ${config.escalation_rules ? 'Reglas de escalada: ' + config.escalation_rules : ''}`
        : 'Sos un asistente de atención al cliente. Respondé de forma amigable y concisa.',
    };

    const response = await this.aiService.generateResponse(
      message,
      chatbotConfig,
      [],
      orgId,
    );

    return { response };
  }
}
