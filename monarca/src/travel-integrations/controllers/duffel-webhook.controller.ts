import { Body, Controller, HttpCode, Post, Req, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import * as crypto from 'crypto';
import { DuffelWebhookService } from '../services/duffel-webhook.service';

@ApiTags('travel-integrations')
@Controller('travel-integrations/duffel')
export class DuffelWebhookController {
  constructor(private readonly duffelWebhookService: DuffelWebhookService) {}

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive Duffel webhook events' })
  async handleWebhook(
    @Req() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    // Validate webhook signature
    const signature = req.headers['duffel-signature'] as string;
    const secret = process.env.DUFFEL_WEBHOOK_SECRET?.trim();

    console.log('[Webhook] Headers received:', Object.keys(req.headers));
    console.log('[Webhook] Signature present:', !!signature);
    console.log('[Webhook] Secret configured:', !!secret);

    // In development, allow webhook without signature. In production, require it.
    if (secret && signature) {
      const rawBody = req.rawBody || JSON.stringify(body);
      const calculatedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (signature !== calculatedSignature) {
        console.warn('[Webhook] Signature validation FAILED');
        throw new BadRequestException('Invalid webhook signature');
      }
      console.log('[Webhook] Signature validation OK');
    } else if (!secret && process.env.NODE_ENV === 'production') {
      throw new BadRequestException(
        'DUFFEL_WEBHOOK_SECRET not configured in production',
      );
    } else if (!signature) {
      console.warn(
        '[Webhook] No signature provided. Accepting in development mode.',
      );
    }

    return this.duffelWebhookService.handleWebhook(body as never);
  }
}
