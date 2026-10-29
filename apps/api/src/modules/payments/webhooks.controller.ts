import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('mercadopago')
  @HttpCode(200)
  async mercadopago(
    @Body() body: any,
    @Query() query: any,
    @Headers('x-signature') xSignature?: string,
    @Headers('x-request-id') xRequestId?: string,
  ) {
    // O MP pode enviar o payload no body (novo) ou via query (?topic=...&id=...)
    const payload =
      body?.type || body?.topic ? body : { ...query, ...body };

    const dataId = payload?.data?.id ?? query?.['data.id'] ?? '';
    const ts = this.extractTs(xSignature);

    return this.payments.handleWebhook(
      payload,
      { xSignature, xRequestId },
      dataId,
      ts,
    );
  }

  private extractTs(xSignature?: string): string {
    if (!xSignature) return '';
    for (const part of xSignature.split(',')) {
      const [k, v] = part.split('=');
      if (k?.trim() === 'ts') return v?.trim() ?? '';
    }
    return '';
  }
}