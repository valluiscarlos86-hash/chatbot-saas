import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { AiService } from '../ai.service';

@Module({
  controllers: [ConversationsController],
  providers: [AiService],
})
export class ConversationsModule {}
