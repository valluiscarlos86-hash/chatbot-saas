import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AiService } from './ai.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, AiService],
})
export class DocumentsModule {}