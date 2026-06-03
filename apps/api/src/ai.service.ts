import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private readonly logger = new Logger(AiService.name);

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateResponse(
    userMessage: string,
    chatbotConfig: {
      botName: string;
      tone: string;
      language: string;
      systemPrompt: string;
    },
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    try {
    const systemMessage = `
Sos ${chatbotConfig.botName}, un asistente de atención al cliente de ${chatbotConfig.botName}.

${chatbotConfig.systemPrompt}

Instrucciones específicas del negocio:
${chatbotConfig.tone === 'formal' ? 'Usá un tono formal y profesional.' : chatbotConfig.tone === 'neutral' ? 'Usá un tono neutro y directo.' : 'Usá un tono amigable y cercano.'}

Reglas que siempre debés seguir:
- Respondé siempre en español
- NUNCA saludes en cada mensaje. Solo saludá una vez al inicio. Si el cliente ya escribió antes, respondé directo a su consulta sin decir "Hola" ni "Buenos días"
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
}