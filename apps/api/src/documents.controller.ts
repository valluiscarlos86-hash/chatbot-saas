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

@Controller('documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    private documentsService: DocumentsService,
  ) {}

  // Listar documentos de una organización
  @Get()
  async listDocuments(@Body('orgId') orgId: string) {
    const result = await this.db.execute(sql`
      SELECT id, name, file_type, file_size, status, chunk_count, created_at
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