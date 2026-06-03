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
Sos ${chatbotConfig.botName}, un asistente de atención al cliente.

${chatbotConfig.systemPrompt}

Tono de respuesta: ${chatbotConfig.tone}
Idioma: ${chatbotConfig.language}

Reglas importantes:
- Respondé siempre en ${chatbotConfig.language}
- Mantené el tono ${chatbotConfig.tone} en todo momento
- Si no sabés algo, decí que vas a consultar con el equipo
- Sé conciso, las respuestas por WhatsApp deben ser cortas y claras
- No uses markdown ni asteriscos en las respuestas
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