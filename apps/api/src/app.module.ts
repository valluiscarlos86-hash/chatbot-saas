import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DatabaseModule } from './database/database.module'
import { OrganizationsModule } from './organizations/organizations.module'
import { WebhooksModule } from './webhooks/webhooks.module'
import { DocumentsModule } from './documents.module'
import { AiModule } from './ai.module'
import { ConversationsModule } from './conversations/conversations.module'
import { WhatsappAccountsModule } from './whatsapp-accounts/whatsapp-accounts.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    OrganizationsModule,
    WebhooksModule,
    DocumentsModule,
    AiModule,
    ConversationsModule,
    WhatsappAccountsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}