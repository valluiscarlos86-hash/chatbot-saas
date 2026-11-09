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
      SELECT bot_name, bot_tone, business_name, business_description, escalation_rules, office_hours
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
      officeHours: config?.office_hours || undefined,
    };

    const [reply, relevantChunks] = await Promise.all([
      this.aiService.generateResponse(message, chatbotConfig, [], orgId),
      this.aiService.searchRelevantChunksWithSources(message, orgId),
    ]);

    const sources = relevantChunks.map((chunk) => ({
      documentName: chunk.documentName,
      sourceType: chunk.sourceType,
      sourceUrl: chunk.sourceUrl,
      chunkText: chunk.chunkText,
      similarity: chunk.similarity,
    }));

    // El chat de prueba del panel no tiene una conversación asociada, así que
    // no cambia ningún estado: solo informa si el asistente pidió derivar, para
    // poder verificar la decisión sin pasar por WhatsApp.
    return { response: reply.response, handoff: reply.handoff, sources };
  }
}
