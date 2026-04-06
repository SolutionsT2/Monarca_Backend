import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DuffelWebhookService } from '../services/duffel-webhook.service';

@ApiTags('travel-integrations')
@Controller('travel-integrations/duffel')
export class DuffelWebhookController {
  constructor(private readonly duffelWebhookService: DuffelWebhookService) {}

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive Duffel webhook events' })
  async handleWebhook(@Body() body: Record<string, unknown>) {
    return this.duffelWebhookService.handleWebhook(body as never);
  }
}
