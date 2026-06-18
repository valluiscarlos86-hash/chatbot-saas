import { Injectable, Logger, Inject } from '@nestjs/common';
import OpenAI from 'openai';
import { DATABASE_CONNECTION } from './database/database.module';
import { sql } from 'drizzle-orm';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private readonly logger = new Logger(AiService.name);

  constructor(@Inject(DATABASE_CONNECTION) private db: any) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Convierte un texto en un vector de 1536 números (embedding)
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  // Busca los chunks más relevantes en los documentos de una empresa
  async searchRelevantChunks(query: string, orgId: string): Promise<string[]> {
    try {
      // 1 — Convertir la pregunta del cliente en vector
      const queryEmbedding = await this.generateEmbedding(query);
      const vectorString = `[${queryEmbedding.join(',')}]`;

      // 2 — Buscar los 4 chunks más parecidos, SIEMPRE filtrando por org_id
      const result = await this.db.execute(sql`
        SELECT chunk_text,
               1 - (embedding <=> ${vectorString}::vector) AS similarity
        FROM embeddings
        WHERE org_id = ${orgId}
          AND 1 - (embedding <=> ${vectorString}::vector) > 0.3
        ORDER BY embedding <=> ${vectorString}::vector
        LIMIT 4
      `);

      const rows = result.rows || result;
      const chunks = (rows as any[]).map((row) => row.chunk_text);

      this.logger.log(`Encontrados ${chunks.length} chunks relevantes para: "${query}"`);
      return chunks;
    } catch (error) {
      this.logger.error('Error buscando chunks:', error);
      return [];
    }
  }

  private getArgentinaDateTime(): string {
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());
  }

  async generateResponse(
    userMessage: string,
    chatbotConfig: {
      botName: string;
      tone: string;
      language: string;
      systemPrompt: string;
      officeHours?: string;
    },
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    orgId?: string,
  ): Promise<string> {
    try {
      // Buscar contexto relevante en los documentos (si hay orgId)
      let knowledgeContext = '';
      if (orgId) {
        const chunks = await this.searchRelevantChunks(userMessage, orgId);
        if (chunks.length > 0) {
          knowledgeContext = `

Información del negocio (usá esto para responder):
${chunks.map((c, i) => `[${i + 1}] ${c}`).join('\n\n')}`;
        }
      }

      const dateTimeContext = `Fecha y hora actual: ${this.getArgentinaDateTime()} (hora de Argentina).`;
      const officeHoursInstruction = chatbotConfig.officeHours
        ? `\nHorario de atención del negocio: ${chatbotConfig.officeHours}\nCompará la hora actual contra ese horario para saber si el negocio está abierto o cerrado en este momento, y respondé en consecuencia (no asumas que siempre está abierto).`
        : '';

      const systemMessage = `
Sos ${chatbotConfig.botName}, un asistente de atención al cliente de ${chatbotConfig.botName}.

${dateTimeContext}${officeHoursInstruction}

${chatbotConfig.systemPrompt}

Instrucciones específicas del negocio:
${chatbotConfig.tone === 'formal' ? 'Usá un tono formal y profesional.' : chatbotConfig.tone === 'neutral' ? 'Usá un tono neutro y directo.' : 'Usá un tono amigable y cercano.'}
${knowledgeContext}

Reglas que siempre debés seguir:
- Respondé siempre en español
- NUNCA saludes en cada mensaje. Solo saludá una vez al inicio. Si el cliente ya escribió antes, respondé directo a su consulta sin decir "Hola" ni "Buenos días"
- Usá la información del negocio de arriba para responder. Si la respuesta está ahí, respondé con esos datos.
- Si no tenés información específica sobre algo, decí: "No tengo esa información disponible, te comunico con un asesor" — nunca inventes datos
- Respuestas cortas y claras, estás en WhatsApp
- Sin markdown, sin asteriscos, sin listas con guiones
- Sin exclamaciones exageradas
      `.trim();

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemMessage },
        ...conversationHistory.slice(-10),
        { role: 'user', content: userMessage },
      ];

      this.logger.log(`Llamando a OpenAI para mensaje: "${userMessage}"`);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        throw new Error('OpenAI devolvió una respuesta vacía');
      }

      this.logger.log(`Respuesta generada: "${response}"`);
      return response;
    } catch (error) {
      this.logger.error('Error al llamar a OpenAI:', error);
      return 'Lo siento, estoy teniendo dificultades técnicas en este momento. Un agente te contactará pronto.';
    }
  }

  async generateSummary(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    const transcript = messages
      .map(m => `${m.role === 'user' ? 'Cliente' : 'Bot'}: ${m.content}`)
      .join('\n');

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Resumí esta conversación para un agente que la va a atender ahora. Indicá: qué quiere el cliente, qué se le respondió, en qué quedó la conversación, y qué necesita el agente hacer ahora. Máximo 4 líneas, directo y útil. Respondé en español.',
        },
        { role: 'user', content: transcript },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('OpenAI devolvió una respuesta vacía');
    this.logger.log('Resumen generado para conversación');
    return response;
  }
}