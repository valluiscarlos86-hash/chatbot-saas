import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { AiModule } from '../ai.module';

@Module({
  imports: [AiModule],
  controllers: [ConversationsController],
})
export class ConversationsModule {}
