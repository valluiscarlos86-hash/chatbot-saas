import { Injectable, Logger, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from './database/database.module';
import { sql } from 'drizzle-orm';
import { AiService } from './ai.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    private aiService: AiService,
  ) {}

  // Divide un texto largo en chunks de ~500 palabras con solapamiento
  private chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim().length > 0) {
        chunks.push(chunk);
      }
      if (i + chunkSize >= words.length) break;
    }

    return chunks;
  }

  // Procesa un documento: lo trocea, genera embeddings y los guarda
  async processDocument(
    documentId: string,
    orgId: string,
    text: string,
  ): Promise<void> {
    this.logger.log(`Procesando documento ${documentId}`);

    try {
      // 1 — Marcar como "procesando"
      await this.db.execute(sql`
        UPDATE knowledge_documents
        SET status = 'processing', updated_at = now()
        WHERE id = ${documentId}
      `);

      // 2 — Trocear el texto
      const chunks = this.chunkText(text);
      this.logger.log(`Documento dividido en ${chunks.length} chunks`);

      // 3 — Generar embedding de cada chunk y guardarlo
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await this.aiService.generateEmbedding(chunks[i]);
        const vectorString = `[${embedding.join(',')}]`;

        await this.db.execute(sql`
          INSERT INTO embeddings (org_id, document_id, chunk_text, chunk_index, embedding)
          VALUES (${orgId}, ${documentId}, ${chunks[i]}, ${i}, ${vectorString}::vector)
        `);
      }

      // 4 — Marcar como "listo" y guardar la cantidad de chunks
      await this.db.execute(sql`
        UPDATE knowledge_documents
        SET status = 'ready', chunk_count = ${chunks.length}, updated_at = now()
        WHERE id = ${documentId}
      `);

      this.logger.log(`Documento ${documentId} procesado: ${chunks.length} chunks`);
    } catch (error) {
      this.logger.error(`Error procesando documento ${documentId}:`, error);
      await this.db.execute(sql`
        UPDATE knowledge_documents
        SET status = 'error', error_message = ${String(error)}, updated_at = now()
        WHERE id = ${documentId}
      `);
    }
  }

  // Igual que processDocument, pero trocea cada página por separado antes de
  // concatenar los chunks, así ningún chunk mezcla el final de una página con
  // el principio de otra. El documento ya fue insertado con status 'processing'.
  async processCrawledSite(
    documentId: string,
    orgId: string,
    pages: Array<{ title: string; content: string; url: string }>,
  ): Promise<void> {
    this.logger.log(`Procesando sitio rastreado ${documentId} (${pages.length} páginas)`);

    try {
      const allChunks: string[] = [];
      for (const page of pages) {
        allChunks.push(...this.chunkText(page.content));
      }
      this.logger.log(`Sitio dividido en ${allChunks.length} chunks (${pages.length} páginas)`);

      for (let i = 0; i < allChunks.length; i++) {
        const embedding = await this.aiService.generateEmbedding(allChunks[i]);
        const vectorString = `[${embedding.join(',')}]`;

        await this.db.execute(sql`
          INSERT INTO embeddings (org_id, document_id, chunk_text, chunk_index, embedding)
          VALUES (${orgId}, ${documentId}, ${allChunks[i]}, ${i}, ${vectorString}::vector)
        `);
      }

      const totalSize = pages.reduce((sum, p) => sum + p.content.length, 0);
      await this.db.execute(sql`
        UPDATE knowledge_documents
        SET status = 'ready', chunk_count = ${allChunks.length}, file_size = ${totalSize}, updated_at = now()
        WHERE id = ${documentId}
      `);

      this.logger.log(`Sitio ${documentId} procesado: ${allChunks.length} chunks de ${pages.length} páginas`);
    } catch (error) {
      this.logger.error(`Error procesando sitio rastreado ${documentId}:`, error);
      await this.db.execute(sql`
        UPDATE knowledge_documents
        SET status = 'error', error_message = ${String(error)}, updated_at = now()
        WHERE id = ${documentId}
      `);
    }
  }
}