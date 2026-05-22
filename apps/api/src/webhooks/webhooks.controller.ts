import { Controller, Post, Headers, Body, HttpCode } from '@nestjs/common'
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
}