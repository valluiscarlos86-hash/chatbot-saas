import { Controller, Post, Get, Headers, Body, HttpCode, Query } from '@nestjs/common'
import { WebhooksService } from './webhooks.service'

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('clerk')
  @HttpCode(200)
  async handleClerkWebhook(
    @Headers() headers: Record<string, string>,
    @Body() body: any,
  ) {
    return this.webhooksService.handleClerkEvent(headers, body)
  }

  @Get('whatsapp')
  verifyWhatsappWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    return this.webhooksService.verifyWhatsapp(mode, token, challenge)
  }

  @Post('whatsapp')
  @HttpCode(200)
  async handleWhatsappWebhook(@Body() body: any) {
    return this.webhooksService.handleWhatsappEvent(body)
  }
}