import { Injectable, Logger, Inject } from '@nestjs/common';
import OpenAI from 'openai';
import { DATABASE_CONNECTION } from './database/database.module';
import { sql } from 'drizzle-orm';
import { TiendanubeService } from './tiendanube/tiendanube.service';

// Motivos por los que el asistente puede pedir la derivacion a una persona.
// 'error_tecnico' no lo elige el modelo: lo genera el codigo cuando la llamada
// al proveedor de IA falla, para que el cliente no quede sin atencion.
export type MotivoDerivacion =
  | 'pedido_explicito'
  | 'sin_informacion'
  | 'excepcion_a_politica'
  | 'reclamo'
  | 'otro'
  | 'error_tecnico';

export interface Derivacion {
  motivo: MotivoDerivacion;
  resumen: string;
}

// El servicio de IA no toca la base de datos: devuelve la respuesta y, si
// corresponde, la decision de derivar. Quien llama (el webhook) es el que
// aplica el cambio de estado. Asi la generacion de texto queda separada de los
// efectos sobre la conversacion, y se puede probar una sin la otra.
export interface RespuestaAsistente {
  response: string;
  handoff: Derivacion | null;
}

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

  // El modelo ignora a veces la instruccion de no usar markdown, sobre todo
  // cuando enumera productos. Como el destino final es WhatsApp, que no
  // interpreta markdown, la limpieza se hace en codigo: es una garantia, no una
  // sugerencia. Tambien se eliminan las URL, que el prototipo no debe enviar.
  private sanitizeForWhatsapp(text: string): string {
    return (
      text
        // Enlaces en formato markdown: se conserva el texto visible.
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        // Negrita, cursiva y tachado.
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/(?<![\w*])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![\w*])/g, '$1')
        .replace(/~~(.+?)~~/g, '$1')
        // Bloques y fragmentos de codigo.
        .replace(/```[a-z]*\n?/gi, '')
        .replace(/`([^`\n]+)`/g, '$1')
        // Encabezados y citas al comienzo de una linea.
        .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
        .replace(/^[ \t]*>[ \t]?/gm, '')
        // Vinetas y numeracion al comienzo de una linea.
        .replace(/^[ \t]*[-*+][ \t]+/gm, '')
        .replace(/^[ \t]*\d+[.)][ \t]+/gm, '')
        // Direcciones web sueltas.
        .replace(/https?:\/\/\S+/gi, '')
        .replace(/\bwww\.\S+/gi, '')
        // Espacios y saltos de linea que deja la limpieza.
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    );
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

  // Determina si el negocio esta abierto comparando la hora actual de Argentina
  // contra el horario configurado por la empresa. Devuelve true (abierto),
  // false (cerrado) o null cuando el texto del horario no sigue un formato
  // reconocible: en ese caso el sistema no afirma nada, para no arriesgar un
  // dato incorrecto. Esta decision se calcula en codigo y NO se delega al
  // modelo de lenguaje, que no sabe comparar horas de forma confiable.
  private isOpenNow(officeHours: string): boolean | null {
    const DIAS: Record<string, number> = {
      domingo: 0,
      lunes: 1,
      martes: 2,
      miercoles: 3,
      jueves: 4,
      viernes: 5,
      sabado: 6,
    };

    // Normaliza el texto: minusculas y sin tildes, para que "miércoles" y
    // "Miercoles" se reconozcan igual.
    const sinTilde = (s: string): string =>
      s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    // Acepta singular y plural ("sabado" y "sabados").
    const aDia = (s: string): number | undefined => {
      const base = sinTilde(s);
      return DIAS[base] ?? DIAS[base.replace(/s$/, '')];
    };

    const texto = sinTilde(officeHours);

    // Reconoce tramos del tipo "lunes a viernes de 9 a 18" o "sabados 10-13".
    const patron =
      /(domingo|lunes|martes|miercoles|jueves|viernes|sabado)s?(?:\s*(?:a|al|hasta)\s*(domingo|lunes|martes|miercoles|jueves|viernes|sabado)s?)?[^0-9]{0,20}(\d{1,2})(?::(\d{2}))?\s*(?:a|hasta|-)\s*(\d{1,2})(?::(\d{2}))?/g;

    const tramos: Array<{ dias: number[]; desde: number; hasta: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = patron.exec(texto)) !== null) {
      const d1 = aDia(m[1]);
      if (d1 === undefined) continue;
      const d2 = m[2] ? aDia(m[2]) : d1;
      if (d2 === undefined) continue;

      // Expande el rango de dias ("lunes a viernes" -> [1,2,3,4,5]).
      const dias: number[] = [];
      for (let d = d1; dias.length <= 7; d = (d + 1) % 7) {
        dias.push(d);
        if (d === d2) break;
      }

      const desde = parseInt(m[3], 10) * 60 + (m[4] ? parseInt(m[4], 10) : 0);
      const hasta = parseInt(m[5], 10) * 60 + (m[6] ? parseInt(m[6], 10) : 0);
      if (hasta <= desde) continue;
      tramos.push({ dias, desde, hasta });
    }

    // Sin tramos reconocibles no se puede decidir.
    if (tramos.length === 0) return null;

    // Hora y dia actuales en el huso de Argentina, independientes del huso del
    // servidor donde corre la aplicacion.
    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());

    const CORTO: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const hoy = CORTO[partes.find((p) => p.type === 'weekday')?.value ?? ''];
    if (hoy === undefined) return null;

    const hora = parseInt(partes.find((p) => p.type === 'hour')?.value ?? '', 10);
    const minuto = parseInt(partes.find((p) => p.type === 'minute')?.value ?? '', 10);
    if (Number.isNaN(hora) || Number.isNaN(minuto)) return null;
    const ahora = hora * 60 + minuto;

    return tramos.some((t) => t.dias.includes(hoy) && ahora >= t.desde && ahora < t.hasta);
  }

  // Herramienta siempre disponible. Se expone como function calling, igual que
  // la consulta al catalogo, en lugar de detectar frases en la respuesta del
  // modelo: asi la decision es explicita, queda en el log y la ejecuta el
  // codigo, no el texto.
  private getHandoffTool(): OpenAI.Chat.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: 'derivar_a_humano',
        description:
          'Deriva la conversación a una persona del equipo. Llamala SIEMPRE que: el cliente pida explícitamente hablar con una persona, un humano, un asesor o un encargado; la consulta requiera una excepción a las políticas del negocio; no tengas información para responder; o el cliente exprese un reclamo o enojo. Llamala ANTES de redactar tu respuesta al cliente.',
        parameters: {
          type: 'object',
          properties: {
            motivo: {
              type: 'string',
              enum: ['pedido_explicito', 'sin_informacion', 'excepcion_a_politica', 'reclamo', 'otro'],
              description: 'Motivo de la derivación.',
            },
            resumen: {
              type: 'string',
              description:
                'Entre una y tres oraciones con lo que el cliente necesita y los datos que ya diste o relevaste, para que la persona que tome la conversación no tenga que leerla entera.',
            },
          },
          required: ['motivo', 'resumen'],
        },
      },
    };
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
          // Un resultado vacio significa que la busqueda no encontro coincidencias,
          // NO que el producto no exista ni que no haya stock. La diferencia
          // importa: afirmar "no esta disponible" seria afirmar algo que el
          // sistema no verifico.
          return JSON.stringify({
            encontrado: false,
            mensaje:
              'La búsqueda no encontró coincidencias en el catálogo. Esto NO significa que el producto no exista ni que no haya stock: puede estar nombrado de otra forma. No afirmes que no está disponible.',
          });
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
  ): Promise<RespuestaAsistente> {
    // Se declara fuera del try para que siga disponible en el catch.
    let handoff: Derivacion | null = null;
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
      // El estado abierto/cerrado se calcula en codigo (isOpenNow) y se le
      // entrega resuelto al modelo. Antes se le pasaban el horario y la hora
      // actual y se le pedia que comparara: el modelo se equivocaba.
      const openNow = chatbotConfig.officeHours
        ? this.isOpenNow(chatbotConfig.officeHours)
        : null;
      const officeHoursInstruction = chatbotConfig.officeHours
        ? `\nHorario de atención del negocio: ${chatbotConfig.officeHours}` +
          (openNow === null
            ? `\nEl sistema no pudo determinar automáticamente si el negocio está abierto en este momento. No afirmes que está abierto ni que está cerrado: si el cliente lo pregunta, indicale el horario de atención y que verifique contra la hora actual.`
            : `\nEstado del negocio en este momento: ${openNow ? 'ABIERTO' : 'CERRADO'}. Este dato ya fue calculado por el sistema: usalo tal cual y no lo deduzcas por tu cuenta.`)
        : '';

      const tiendanubeConnected = orgId ? await this.tiendanube.isConnected(orgId) : false;
      // La herramienta de derivacion esta siempre disponible; las del catalogo
      // solo si hay tienda conectada.
      const tools: OpenAI.Chat.ChatCompletionTool[] = [
        ...(tiendanubeConnected ? this.getTiendanubeTools() : []),
        this.getHandoffTool(),
      ];
      const tiendanubeInstruction = tiendanubeConnected
        ? '\n\nEste negocio tiene una tienda online conectada. Cuando el cliente pregunte por productos, precios, stock o disponibilidad, USÁ la herramienta buscar_productos para consultar datos reales en vivo. No inventes precios ni stock: siempre consultá. Los precios están en pesos argentinos.\nNUNCA incluyas links, URLs ni direcciones web en tus respuestas. No uses markdown de ningún tipo (ni [texto](link), ni asteriscos, ni guiones). Respondé en texto plano. Si el cliente quiere comprar, asesoralo sobre el producto (precio, stock, características) pero no le pases ninguna URL.\n\nREGLA DE PRECEDENCIA DE FUENTES (muy importante):\nEsta tienda tiene Tiendanube conectado. Para CUALQUIER pregunta sobre precio, stock, disponibilidad o características de un producto, la ÚNICA fuente válida es la herramienta buscar_productos (datos en vivo de Tiendanube).\n- NUNCA uses la "Información del negocio" (documentos cargados) para responder precios, stock o disponibilidad de productos. Esos documentos pueden estar desactualizados.\n- Si buscar_productos NO encuentra el producto que pregunta el cliente, NO afirmes que no está disponible ni que no existe: decí que no lo encontrás en el catálogo con ese nombre, pedile que lo describa de otra forma y ofrecele derivarlo a una persona del equipo. NO inventes ni recuperes su precio/stock desde los documentos del negocio, aunque encuentres algo parecido.\n- Los documentos del negocio SÍ los podés usar para responder sobre envíos, formas de pago, horarios, devoluciones, políticas y preguntas generales. Para eso siguen siendo válidos.\nEn resumen: productos, precios y stock vienen SIEMPRE de Tiendanube; el resto de la información puede venir de los documentos.\n- Si buscar_productos devuelve un error o no responde, NO afirmes precio, promoción, descuento ni disponibilidad: decí que no podés confirmar ese dato en este momento y que lo derivás a una persona del equipo.'
        : // Sin tienda online conectada, la fuente valida de precios y stock son
          // los documentos que cargo el negocio (lista de precios, catalogo).
          // Mantenerlos actualizados es responsabilidad del negocio; el sistema
          // responde con lo que figura ahi. Lo que sigue prohibido es inventar
          // lo que NO figura en ningun documento.
          '\n\nEste negocio no tiene una tienda online conectada: la información de productos, precios y disponibilidad proviene de los documentos que cargó el negocio.\n- Usá la Información del negocio de arriba como fuente válida para responder precios, stock y características de los productos.\n- Si el producto que pregunta el cliente NO figura en los documentos, no inventes ni deduzcas su precio ni su disponibilidad: decí que no lo encontrás en la lista, pedile que lo describa de otra forma y ofrecele derivarlo a una persona del equipo.\n- Tampoco inventes un precio aproximado, un rango, un descuento ni una promoción que no estén escritos en los documentos.\n- No digas que consultaste stock en tiempo real: respondé con lo que figura en la información del negocio.';

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
- Si el cliente pide hablar con una persona, un humano, un asesor, un vendedor, un encargado o alguien del equipo, no intentes resolverlo vos ni le ofrezcas alternativas: confirmá la derivación y decí que una persona del equipo le va a responder
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
          let result: string;
          if (toolCall.function.name === 'derivar_a_humano') {
            handoff = {
              motivo: (args.motivo as MotivoDerivacion) || 'otro',
              resumen: String(args.resumen || '').trim() || 'Sin resumen.',
            };
            this.logger.log(`Derivación solicitada por el asistente. Motivo: ${handoff.motivo}`);
            result = JSON.stringify({
              derivado: true,
              instruccion:
                'La conversación ya fue derivada. Confirmale al cliente, en una o dos oraciones, que una persona del equipo le va a responder. No le ofrezcas alternativas ni intentes resolverlo vos.',
            });
          } else {
            result = await this.executeTiendanubeTool(orgId as string, toolCall.function.name, args);
          }
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
        // El modelo derivó pero no redactó nada: se responde con un texto por
        // omisión en vez de dejar al cliente sin contestación.
        if (handoff) {
          return {
            response: 'Te comunico con una persona del equipo para que te ayude.',
            handoff,
          };
        }
        throw new Error('OpenAI devolvió una respuesta vacía');
      }

      const cleanResponse = this.sanitizeForWhatsapp(response);
      this.logger.log(`Respuesta generada: "${cleanResponse}"`);
      return { response: cleanResponse, handoff };
    } catch (error) {
      // Si la generacion automatica falla, la conversacion se deriva. Antes
      // quedaba con el bot activo y nadie la atendia: el cliente recibia una
      // disculpa y nada mas.
      this.logger.error('Error al llamar a OpenAI:', error);
      return {
        response: 'Lo siento, estoy teniendo dificultades técnicas en este momento. Un agente te contactará pronto.',
        handoff: {
          motivo: 'error_tecnico',
          resumen:
            'La generación automática de respuestas falló. La conversación se deriva para que una persona la atienda.',
        },
      };
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