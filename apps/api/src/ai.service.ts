import { Injectable, Logger, Inject } from '@nestjs/common';
import OpenAI from 'openai';
import { DATABASE_CONNECTION } from './database/database.module';
import { sql } from 'drizzle-orm';
import { TiendanubeService } from './tiendanube/tiendanube.service';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    private tiendanube: TiendanubeService,
  ) {
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

  // Extrae los valores de texto "útiles" de un objeto/array JSON, descartando
  // claves técnicas (precio, sku, urls de imagen, etc).
  private extractTextFromJson(value: any): string {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      return value.map((v) => this.extractTextFromJson(v)).filter(Boolean).join('. ');
    }
    if (value && typeof value === 'object') {
      const preferredKeys = ['title', 'description', 'name', 'content', 'text', 'summary'];
      const preferred = preferredKeys
        .filter((k) => typeof value[k] === 'string' && value[k].trim().length > 0)
        .map((k) => value[k]);
      if (preferred.length > 0) return preferred.join('. ');

      return Object.values(value)
        .filter((v) => typeof v === 'string' && v.trim().length > 0)
        .join('. ');
    }
    return '';
  }

  // Limpia un chunk crudo para que sea legible por un usuario sin conocimientos
  // técnicos: parsea JSON embebido (aunque esté cortado por el chunking), sacando
  // solo el texto relevante, y achica URLs de imágenes/enlaces largos.
  private cleanChunkText(raw: string): string {
    let text = raw.replace(/\\n/g, ' ');

    try {
      const parsed = JSON.parse(text);
      const extracted = this.extractTextFromJson(parsed);
      if (extracted.trim().length > 0) text = extracted;
    } catch {
      const matches = [
        ...text.matchAll(/"(?:title|description|name|content|text|summary)"\s*:\s*"([^"]*)"/gi),
      ];
      if (matches.length > 0) {
        text = matches.map((m) => m[1]).join('. ');
      }
    }

    text = text.replace(/https?:\/\/\S+\.(webp|jpe?g|png|gif|svg)(\?\S*)?/gi, '[imagen]');
    text = text.replace(/https?:\/\/\S{40,}/g, '[enlace]');
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  // Igual que searchRelevantChunks, pero además trae el documento de origen de cada chunk.
  // Solo se usa para debugging en el chat de prueba — el flujo de WhatsApp no la llama.
  async searchRelevantChunksWithSources(
    query: string,
    orgId: string,
  ): Promise<
    Array<{
      chunkText: string;
      similarity: number;
      documentName: string;
      sourceType: 'file' | 'url';
      sourceUrl: string | null;
    }>
  > {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const vectorString = `[${queryEmbedding.join(',')}]`;

      const result = await this.db.execute(sql`
        SELECT e.chunk_text,
               1 - (e.embedding <=> ${vectorString}::vector) AS similarity,
               kd.name AS document_name,
               kd.source_type,
               kd.source_url
        FROM embeddings e
        JOIN knowledge_documents kd ON kd.id = e.document_id
        WHERE e.org_id = ${orgId}
          AND 1 - (e.embedding <=> ${vectorString}::vector) > 0.3
        ORDER BY e.embedding <=> ${vectorString}::vector
        LIMIT 4
      `);

      const rows = result.rows || result;
      return (rows as any[]).map((row) => ({
        chunkText: this.cleanChunkText(row.chunk_text),
        similarity: Number(row.similarity),
        documentName: row.document_name,
        sourceType: row.source_type,
        sourceUrl: row.source_url,
      }));
    } catch (error) {
      this.logger.error('Error buscando chunks con fuentes:', error);
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

  private getTiendanubeTools(): OpenAI.Chat.ChatCompletionTool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'buscar_productos',
          description:
            'Busca productos en la tienda online del negocio por nombre, tipo o característica. Usar SIEMPRE que el cliente pregunte por disponibilidad, precio, stock, o si tienen determinado producto. Devuelve nombre, precio, precio con descuento, stock y disponibilidad de cada producto que coincide.',
          parameters: {
            type: 'object',
            properties: {
              consulta: {
                type: 'string',
                description: 'Lo que busca el cliente, ej: "pantubotas", "botas negras", "algo abrigado para los pies"',
              },
            },
            required: ['consulta'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'ver_producto',
          description:
            'Obtiene el detalle completo de un producto específico por su id, incluyendo todas sus variantes (talles/colores) con stock y precio individual. Usar cuando el cliente pide detalle de un producto puntual que ya apareció en una búsqueda previa, por ejemplo para consultar otra variante.',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'El id numérico del producto' },
            },
            required: ['id'],
          },
        },
      },
    ];
  }

  private compactProduct(p: { id: number; name: string; priceFrom: string; url: string; hasStock: boolean; variants: { label: string; finalPrice: string; price: string; promotionalPrice: string | null; stock: number | null; available: boolean }[] }) {
    return {
      id: p.id,
      name: p.name,
      priceFrom: p.priceFrom,
      available: p.hasStock,
      variants: p.variants.map((v) => ({
        label: v.label,
        finalPrice: v.finalPrice,
        price: v.price,
        promotionalPrice: v.promotionalPrice,
        stock: v.stock,
        available: v.available,
      })),
    };
  }

  private async executeTiendanubeTool(orgId: string, toolName: string, args: any): Promise<string> {
    try {
      if (toolName === 'buscar_productos') {
        const results = await this.tiendanube.searchProducts(orgId, args.consulta);
        if (results.length === 0) {
          return JSON.stringify({ encontrado: false, mensaje: 'No se encontraron productos para esa búsqueda' });
        }
        return JSON.stringify(results.map((p) => this.compactProduct(p)));
      }

      if (toolName === 'ver_producto') {
        const result = await this.tiendanube.getProductById(orgId, String(args.id));
        if (!result) {
          return JSON.stringify({ encontrado: false, mensaje: 'No se encontró un producto con ese id' });
        }
        return JSON.stringify(this.compactProduct(result));
      }

      return JSON.stringify({ error: `Tool desconocida: ${toolName}` });
    } catch (error) {
      this.logger.error(`Error ejecutando tool ${toolName} de Tiendanube:`, error);
      return JSON.stringify({ error: 'No se pudo consultar el catálogo en este momento' });
    }
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

      const tiendanubeConnected = orgId ? await this.tiendanube.isConnected(orgId) : false;
      const tools = tiendanubeConnected ? this.getTiendanubeTools() : undefined;
      const tiendanubeInstruction = tiendanubeConnected
        ? '\n\nEste negocio tiene una tienda online conectada. Cuando el cliente pregunte por productos, precios, stock o disponibilidad, USÁ la herramienta buscar_productos para consultar datos reales en vivo. No inventes precios ni stock: siempre consultá. Los precios están en pesos argentinos.\nNUNCA incluyas links, URLs ni direcciones web en tus respuestas. No uses markdown de ningún tipo (ni [texto](link), ni asteriscos, ni guiones). Respondé en texto plano. Si el cliente quiere comprar, asesoralo sobre el producto (precio, stock, características) pero no le pases ninguna URL.\n\nREGLA DE PRECEDENCIA DE FUENTES (muy importante):\nEsta tienda tiene Tiendanube conectado. Para CUALQUIER pregunta sobre precio, stock, disponibilidad o características de un producto, la ÚNICA fuente válida es la herramienta buscar_productos (datos en vivo de Tiendanube).\n- NUNCA uses la "Información del negocio" (documentos cargados) para responder precios, stock o disponibilidad de productos. Esos documentos pueden estar desactualizados.\n- Si buscar_productos NO encuentra el producto que pregunta el cliente, respondé que ese producto no está disponible en este momento. NO inventes ni recuperes su precio/stock desde los documentos del negocio, aunque encuentres algo parecido.\n- Los documentos del negocio SÍ los podés usar para responder sobre envíos, formas de pago, horarios, devoluciones, políticas y preguntas generales. Para eso siguen siendo válidos.\nEn resumen: productos, precios y stock vienen SIEMPRE de Tiendanube; el resto de la información puede venir de los documentos.'
        : '';

      if (tiendanubeConnected) {
        this.logger.log(`Tools de Tiendanube activas para org ${orgId}`);
      }

      const systemMessage = `
Sos ${chatbotConfig.botName}, un asistente de atención al cliente de ${chatbotConfig.botName}.

${dateTimeContext}${officeHoursInstruction}

${chatbotConfig.systemPrompt}

Instrucciones específicas del negocio:
${chatbotConfig.tone === 'formal' ? 'Usá un tono formal y profesional.' : chatbotConfig.tone === 'neutral' ? 'Usá un tono neutro y directo.' : 'Usá un tono amigable y cercano.'}
${knowledgeContext}${tiendanubeInstruction}

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

      let completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
        ...(tools ? { tools, tool_choice: 'auto' as const } : {}),
      });

      let message = completion.choices[0]?.message;
      let iterations = 0;

      while (message?.tool_calls && message.tool_calls.length > 0 && iterations < 3) {
        iterations++;
        messages.push(message);

        for (const toolCall of message.tool_calls) {
          if (toolCall.type !== 'function') continue;
          const args = JSON.parse(toolCall.function.arguments || '{}');
          this.logger.log(`Tool ${toolCall.function.name} ejecutada con args ${JSON.stringify(args)}`);
          const result = await this.executeTiendanubeTool(orgId as string, toolCall.function.name, args);
          messages.push({ role: 'tool', tool_call_id: toolCall.id, content: result });
        }

        completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 500,
          temperature: 0.7,
          ...(tools ? { tools, tool_choice: 'auto' as const } : {}),
        });
        message = completion.choices[0]?.message;
      }

      const response = message?.content;

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