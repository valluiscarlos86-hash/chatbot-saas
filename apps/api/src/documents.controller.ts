import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
  Logger,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DATABASE_CONNECTION } from './database/database.module';
import { sql } from 'drizzle-orm';
import { DocumentsService } from './documents.service';
import { FirecrawlService } from './firecrawl.service';

@Controller('documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    private documentsService: DocumentsService,
    private firecrawlService: FirecrawlService,
  ) {}

  // Listar documentos de una organización
  @Get()
  async listDocuments(@Body('orgId') orgId: string) {
    const result = await this.db.execute(sql`
      SELECT id, name, file_type, file_size, status, chunk_count, source_type, source_url, created_at
      FROM knowledge_documents
      ORDER BY created_at DESC
    `);
    return result.rows || result;
  }

  // Subir y procesar un documento
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: any,
    @Body('orgId') orgId: string,
  ) {
    if (!file) {
      return { error: 'No se recibió ningún archivo' };
    }

    this.logger.log(`Recibido archivo: ${file.originalname} (${file.size} bytes)`);

    // 1 — Extraer el texto según el tipo de archivo
    let text = '';
    try {
      if (file.mimetype === 'application/pdf') {
        const { PDFParse } = await import('pdf-parse');
const parser = new PDFParse({ data: file.buffer });
const data = await parser.getText();
await parser.destroy();
        text = data.text;
      } else if (file.mimetype === 'text/plain') {
        text = file.buffer.toString('utf-8');
      } else {
        return { error: 'Tipo de archivo no soportado. Solo PDF o TXT.' };
      }
    } catch (error) {
      this.logger.error('Error extrayendo texto:', error);
      return { error: 'No se pudo leer el archivo' };
    }

    if (!text || text.trim().length === 0) {
      return { error: 'El archivo está vacío o no se pudo extraer texto' };
    }

    // 2 — Guardar el registro del documento
    const inserted = await this.db.execute(sql`
      INSERT INTO knowledge_documents (org_id, name, file_url, file_type, file_size, status)
      VALUES (${orgId}, ${file.originalname}, 'local', ${file.mimetype}, ${file.size}, 'pending')
      RETURNING id
    `);

    const rows = inserted.rows || inserted;
    const documentId = (rows as any[])[0].id;

    // 3 — Procesar en segundo plano (no bloqueamos la respuesta)
    this.documentsService.processDocument(documentId, orgId, text);

    return { success: true, documentId, message: 'Documento recibido, procesando...' };
  }

  // Agregar una URL como fuente de conocimiento.
  // mode 'single' (default): scrape de la página dada, igual que siempre.
  // mode 'full': rastrea el sitio entero en segundo plano (puede tardar minutos).
  @Post('url')
  async addUrl(
    @Body('orgId') orgId: string,
    @Body('url') url: string,
    @Body('mode') mode: 'single' | 'full' = 'single',
  ) {
    if (!orgId) {
      return { error: 'Organización no encontrada' };
    }
    if (!url || !/^https?:\/\/.+/i.test(url)) {
      return { error: 'URL inválida' };
    }

    if (mode === 'full') {
      return this.addFullSite(orgId, url);
    }

    let scraped: { title: string; content: string };
    try {
      scraped = await this.firecrawlService.scrapeUrl(url);
    } catch (error) {
      this.logger.error('Error scrapeando URL:', error);
      return { error: 'No se pudo leer el contenido de esa página' };
    }

    if (!scraped.content || scraped.content.trim().length === 0) {
      return { error: 'No se encontró texto en esa página' };
    }

    const inserted = await this.db.execute(sql`
      INSERT INTO knowledge_documents (org_id, name, file_url, file_type, file_size, status, source_type, source_url)
      VALUES (${orgId}, ${scraped.title}, ${url}, 'text/html', ${scraped.content.length}, 'pending', 'url', ${url})
      RETURNING id
    `);

    const rows = inserted.rows || inserted;
    const documentId = (rows as any[])[0].id;

    this.documentsService.processDocument(documentId, orgId, scraped.content);

    return { success: true, documentId, message: 'URL recibida, procesando...' };
  }

  // Crea el registro en 'processing' y responde al instante; el rastreo del
  // sitio completo corre en segundo plano y termina actualizando el estado.
  private async addFullSite(orgId: string, url: string) {
    const hostname = new URL(url).hostname;

    const inserted = await this.db.execute(sql`
      INSERT INTO knowledge_documents (org_id, name, file_url, file_type, file_size, status, source_type, source_url)
      VALUES (${orgId}, ${hostname}, ${url}, 'text/html', 0, 'processing', 'url', ${url})
      RETURNING id
    `);

    const rows = inserted.rows || inserted;
    const documentId = (rows as any[])[0].id;

    this.crawlAndProcess(documentId, orgId, url);

    return { success: true, documentId, message: 'Sitio recibido, rastreando...' };
  }

  private async crawlAndProcess(documentId: string, orgId: string, url: string) {
    try {
      const pages = await this.firecrawlService.crawlSite(url);
      if (pages.length === 0) {
        throw new Error('No se encontró texto en las páginas rastreadas');
      }
      await this.documentsService.processCrawledSite(documentId, orgId, pages);
    } catch (error) {
      this.logger.error(`Error rastreando sitio ${url}:`, error);
      await this.db.execute(sql`
        UPDATE knowledge_documents
        SET status = 'error', error_message = ${String(error)}, updated_at = now()
        WHERE id = ${documentId}
      `);
    }
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string) {
    // Borrar embeddings del documento
    await this.db.execute(sql`
      DELETE FROM embeddings WHERE document_id = ${id}
    `);

    // Borrar el documento
    await this.db.execute(sql`
      DELETE FROM knowledge_documents WHERE id = ${id}
    `);

    return { success: true };
  }
}