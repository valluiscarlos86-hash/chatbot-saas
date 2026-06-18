import { Module } from '@nestjs/common';
import { WhatsappAccountsController } from './whatsapp-accounts.controller';

@Module({
  controllers: [WhatsappAccountsController],
})
export class WhatsappAccountsModule {}
