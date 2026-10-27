import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MpPaymentResponse,
  MpPreapprovalResponse,
  MpPreferenceResponse,
} from './mercadopago.types';

const MP_API = 'https://api.mercadopago.com';

@Injectable()
export class MercadopagoService {
  private readonly logger = new Logger(MercadopagoService.name);
  private readonly accessToken: string;

  constructor(private readonly config: ConfigService) {
    this.accessToken = this.config.getOrThrow<string>(
      'MERCADOPAGO_ACCESS_TOKEN',
    );
  }

  // ----------------------------------------------------------
  // HTTP HELPER
  // ----------------------------------------------------------
  private async mpFetch<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const res = await fetch(`${MP_API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      },
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      this.logger.error(`MP ${res.status} em ${path}: ${text}`);
      const message = data?.message ?? `Erro MP ${res.status}`;

      // CORREÇÃO 46.8: Distingue os tipos de erro do Mercado Pago
      if (res.status === 404) {
        throw new NotFoundException(message);
      }
      if (res.status === 401 || res.status === 403) {
        throw new BadGatewayException(
          'Credenciais do Mercado Pago inválidas ou sem permissão.',
        );
      }
      if (res.status === 429) {
        throw new ServiceUnavailableException(
          'Limite de requisições ao Mercado Pago excedido. Tente novamente em instantes.',
        );
      }
      if (res.status >= 500) {
        throw new ServiceUnavailableException(
          'Mercado Pago indisponível no momento. Tente novamente mais tarde.',
        );
      }
      throw new BadRequestException(message);
    }

    return data as T;
  }

  // ----------------------------------------------------------
  // PREAPPROVAL (Assinatura)
  // ----------------------------------------------------------
  async createPreapproval(input: {
    reason: string;
    externalReference: string;
    payerEmail: string;
    amountCents: number;
    currency: string;
    intervalUnit: 'month' | 'year';
    intervalCount: number;
    backUrl: string;
  }): Promise<MpPreapprovalResponse> {
    const frequencyType = 'months';
    const frequency = input.intervalUnit === 'year' ? 12 : 1;

    const body = {
      reason: input.reason,
      external_reference: input.externalReference,
      payer_email: input.payerEmail,
      back_url: input.backUrl,
      status: 'pending',
      auto_recurring: {
        frequency,
        frequency_type: frequencyType,
        transaction_amount: input.amountCents / 100,
        currency_id: input.currency,
        // Correção 15: Removido 'repetitions' para permitir renovação contínua.
      },
    };

    return this.mpFetch<MpPreapprovalResponse>('/preapproval', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getPreapproval(id: string): Promise<MpPreapprovalResponse> {
    // CORREÇÃO 46.8: o mpFetch já lança o erro correto (404, 401, 5xx)
    return this.mpFetch<MpPreapprovalResponse>(`/preapproval/${id}`, {
      method: 'GET',
    });
  }

  async cancelPreapproval(id: string): Promise<MpPreapprovalResponse> {
    return this.mpFetch<MpPreapprovalResponse>(`/preapproval/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled' }),
    });
  }

  // ----------------------------------------------------------
  // PREFERENCE (Pagamento avulso — para aluguéis)
  // ----------------------------------------------------------
  async createPreference(input: {
    reason: string;
    externalReference: string;
    amountCents: number;
    currency: string;
    backUrl: string;
    notificationUrl: string;
    payerEmail?: string;
  }): Promise<MpPreferenceResponse> {
    const body = {
      items: [
        {
          title: input.reason,
          quantity: 1,
          unit_price: input.amountCents / 100,
          currency_id: input.currency,
        },
      ],
      external_reference: input.externalReference,
      back_urls: {
        success: `${input.backUrl}?status=success`,
        failure: `${input.backUrl}?status=failure`,
        pending: `${input.backUrl}?status=pending`,
      },
      auto_return: 'approved',
      notification_url: input.notificationUrl,
      ...(input.payerEmail ? { payer: { email: input.payerEmail } } : {}),
    };

    return this.mpFetch<MpPreferenceResponse>('/checkout/preferences', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // ----------------------------------------------------------
  // PAYMENT
  // ----------------------------------------------------------
  async getPayment(id: string | number): Promise<MpPaymentResponse> {
    return this.mpFetch<MpPaymentResponse>(`/v1/payments/${id}`, {
      method: 'GET',
    });
  }
}