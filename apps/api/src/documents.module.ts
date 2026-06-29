import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AiModule } from './ai.module';
import { FirecrawlService } from './firecrawl.service';

@Module({
  imports: [AiModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, FirecrawlService],
})
export class DocumentsModule {}