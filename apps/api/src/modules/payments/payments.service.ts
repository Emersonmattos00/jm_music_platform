import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import {
  OrderStatus,
  RentalStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MercadopagoService } from '../mercadopago/mercadopago.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mp: MercadopagoService,
    private readonly config: ConfigService,
  ) {}

  // ----------------------------------------------------------
  // CRIAR CHECKOUT DE ASSINATURA
  // ----------------------------------------------------------
  async createSubscriptionCheckout(userId: string, planId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });
    if (!plan || !plan.active) {
      throw new NotFoundException('Plano não encontrado ou inativo');
    }

    if (plan.priceCents === 0) {
      throw new BadRequestException('Plano gratuito não requer checkout');
    }

    await this.prisma.subscription.updateMany({
      where: { userId, status: SubscriptionStatus.PENDING },
      data: { status: SubscriptionStatus.CANCELLED },
    });

    const externalReference = `sub-${user.id}-${plan.id}-${Date.now()}`;
    const appUrl = this.config.getOrThrow<string>('APP_URL');

    const isDev = this.config.get<string>('NODE_ENV') !== 'production';
    const testBuyerEmail = this.config.get<string>('MP_TEST_BUYER_EMAIL');
    const payerEmail = isDev && testBuyerEmail ? testBuyerEmail : user.email;

    const preapproval = await this.mp.createPreapproval({
      reason: `JM Music — ${plan.name}`,
      externalReference,
      payerEmail,
      amountCents: plan.priceCents,
      currency: plan.currency,
      intervalUnit: plan.intervalUnit as 'month' | 'year',
      intervalCount: plan.intervalCount,
      backUrl: `${appUrl}/checkout/success`,
    });

    const initPoint =
      preapproval.init_point ?? preapproval.sandbox_init_point ?? null;

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        externalSubscriptionId: preapproval.id,
        status: SubscriptionStatus.PENDING,
        initPoint,
        payerEmail,
      },
      select: {
        id: true,
        status: true,
        externalSubscriptionId: true,
        initPoint: true,
        createdAt: true,
      },
    });

    return {
      subscription,
      checkoutUrl: initPoint,
      plan: {
        id: plan.id,
        name: plan.name,
        priceCents: plan.priceCents,
        currency: plan.currency,
        intervalUnit: plan.intervalUnit,
      },
    };
  }

  // ----------------------------------------------------------
  // CRIAR CHECKOUT DE ALUGUEL (pagamento avulso)
  // ----------------------------------------------------------
  async createRentalCheckout(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Pedido não encontrado');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Pedido não está pendente');
    }

    const appUrl = this.config.getOrThrow<string>('APP_URL');
    const apiUrl = this.config.getOrThrow<string>('API_URL');

    const preference = await this.mp.createPreference({
      reason: `JM Music — Aluguel #${order.id.slice(0, 8)}`,
      externalReference: `ord-${order.id}`,
      amountCents: order.totalCents,
      currency: order.currency,
      backUrl: `${appUrl}/checkout/success`,
      notificationUrl: `${apiUrl}/webhooks/mercadopago`,
    });

    const initPoint =
      preference.init_point ?? preference.sandbox_init_point ?? null;

    return {
      orderId: order.id,
      checkoutUrl: initPoint,
      preferenceId: preference.id,
    };
  }

  // ----------------------------------------------------------
  // STATUS DE UMA ASSINATURA (polling)
  // ----------------------------------------------------------
  async getSubscriptionStatus(userId: string, subscriptionId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!sub || sub.userId !== userId) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    if (
      sub.status === SubscriptionStatus.PENDING &&
      sub.externalSubscriptionId
    ) {
      try {
        const mp = await this.mp.getPreapproval(sub.externalSubscriptionId);
        if (mp.status === 'authorized') {
          const startsAt = mp.date_created
            ? new Date(mp.date_created)
            : new Date();
          const next = mp.next_payment_date
            ? new Date(mp.next_payment_date)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          return this.prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: startsAt,
              currentPeriodEnd: next,
            },
            include: { plan: true },
          });
        }
        if (mp.status === 'cancelled') {
          return this.prisma.subscription.update({
            where: { id: sub.id },
            data: { status: SubscriptionStatus.CANCELLED },
            include: { plan: true },
          });
        }
      } catch (e) {
        this.logger.warn(`Erro consultando MP: ${(e as Error).message}`);
      }
    }

    return sub;
  }

  // ----------------------------------------------------------
  // CANCELAR ASSINATURA
  // ----------------------------------------------------------
  async cancelSubscription(userId: string, subscriptionId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!sub || sub.userId !== userId) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    if (sub.externalSubscriptionId) {
      try {
        await this.mp.cancelPreapproval(sub.externalSubscriptionId);
      } catch (e) {
        this.logger.warn(`Erro cancelando no MP: ${(e as Error).message}`);
      }
    }

    return this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelAtPeriodEnd: true,
      },
      include: { plan: true },
    });
  }

  // ----------------------------------------------------------
  // MINHA ASSINATURA ATUAL
  // ----------------------------------------------------------
  async getMySubscription(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });

    return sub ?? null;
  }

  // ----------------------------------------------------------
  // WEBHOOK — retry-safe + idempotente
  // ----------------------------------------------------------
  async handleWebhook(
    payload: any,
    signature?: {
      xSignature?: string;
      xRequestId?: string;
      manifest?: string;
    },
  ) {
    // Valida assinatura HMAC em produção
    if (this.config.get<string>('NODE_ENV') === 'production') {
      this.verifySignature(signature);
    }

    const eventId =
      payload?.id ??
      payload?.data?.id ??
      `${Date.now()}-${Math.random()}`;

    const existing = await this.prisma.paymentEvent.findUnique({
      where: {
        provider_externalEventId: {
          provider: 'mercadopago',
          externalEventId: String(eventId),
        },
      },
    });

    // Se já foi processado com sucesso → duplicate
    if (existing?.processedAt) {
      return { ok: true, duplicate: true };
    }

    // Se não existe → cria com processedAt null (pending)
    if (!existing) {
      await this.prisma.paymentEvent.create({
        data: {
          provider: 'mercadopago',
          externalEventId: String(eventId),
          eventType: String(payload?.type ?? payload?.topic ?? 'unknown'),
          payload,
          // processedAt: null por padrão → ainda não processado
        },
      });
    }

    const type = payload?.type ?? payload?.topic;
    const resourceId = payload?.data?.id ?? payload?.resource;

    try {
      if (type === 'preapproval' || type === 'subscription_preapproval') {
        await this.handlePreapprovalEvent(String(resourceId));
      } else if (type === 'payment') {
        await this.handlePaymentEvent(String(resourceId));
      }

      // Marca como processado SÓ após sucesso
      await this.prisma.paymentEvent.update({
        where: {
          provider_externalEventId: {
            provider: 'mercadopago',
            externalEventId: String(eventId),
          },
        },
        data: { processedAt: new Date() },
      });

      return { ok: true };
    } catch (e) {
      this.logger.error(
        `Erro processando webhook ${type}: ${(e as Error).message}`,
        (e as Error).stack,
      );
      // Re-lança pra NestJS retornar 500 e o MP retentar
      throw e;
    }
  }

  private verifySignature(sig?: {
    xSignature?: string;
    xRequestId?: string;
    manifest?: string;
  }) {
    const secret = this.config.get<string>('MERCADOPAGO_WEBHOOK_SECRET');

    // Em produção, exige secret
    if (this.config.get<string>('NODE_ENV') === 'production' && !secret) {
      throw new Error('MERCADOPAGO_WEBHOOK_SECRET é obrigatório em produção');
    }

    if (!secret) {
      this.logger.warn(
        'MERCADOPAGO_WEBHOOK_SECRET ausente — pulando validação (INSEGURO)',
      );
      return;
    }

    if (!sig?.xSignature || !sig?.manifest) {
      throw new BadRequestException('Assinatura do webhook ausente');
    }

    const expected = createHmac('sha256', secret)
      .update(sig.manifest)
      .digest('hex');

    const v1 = sig.xSignature
      .split(',')
      .map((p) => p.split('='))
      .find(([k]) => k?.trim() === 'v1')?.[1]
      ?.trim();

    if (!v1 || v1 !== expected) {
      this.logger.error('Assinatura do webhook inválida');
      throw new BadRequestException('Assinatura inválida');
    }
  }

  private async handlePreapprovalEvent(preapprovalId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { externalSubscriptionId: preapprovalId },
    });
    if (!sub) {
      this.logger.warn(`Preapproval ${preapprovalId} sem assinatura local`);
      return;
    }

    const mp = await this.mp.getPreapproval(preapprovalId);

    if (mp.status === 'authorized') {
      const startsAt = mp.date_created
        ? new Date(mp.date_created)
        : new Date();
      const next = mp.next_payment_date
        ? new Date(mp.next_payment_date)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: startsAt,
          currentPeriodEnd: next,
        },
      });
      this.logger.log(`Assinatura ${sub.id} ATIVADA`);
    } else if (mp.status === 'cancelled') {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: SubscriptionStatus.CANCELLED },
      });
    } else if (mp.status === 'paused') {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: SubscriptionStatus.PAUSED },
      });
    }
  }

  private async handlePaymentEvent(paymentId: string) {
    const payment = await this.mp.getPayment(paymentId);
    const ref = payment.external_reference;
    if (!ref) return;

    // Assinatura já é tratada em handlePreapprovalEvent
    if (ref.startsWith('sub-')) return;

    // Aluguel: prefixo ord- (ou compat: UUID puro)
    const orderId = ref.startsWith('ord-') ? ref.slice(4) : ref;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      this.logger.warn(`Order ${orderId} do webhook não encontrado`);
      return;
    }

    if (payment.status === 'approved') {
      if (order.status === OrderStatus.PAID) return; // idempotência

      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
            paidAt: new Date(),
            externalPaymentId: String(payment.id),
          },
        });

        for (const item of order.items) {
          if (!item.productId) continue;

          // productId é SEMPRE RentalProduct.id (faixa OU álbum)
          const product = await tx.rentalProduct.findUnique({
            where: { id: item.productId },
          });
          if (!product) {
            this.logger.warn(
              `RentalProduct ${item.productId} não encontrado (order ${order.id})`,
            );
            continue;
          }

          const startsAt = new Date();
          const expiresAt = new Date(
            startsAt.getTime() + product.durationHours * 60 * 60 * 1000,
          );

          // Caso 1: produto de FAIXA → cria 1 rental
          if (product.trackId) {
            await tx.rental.create({
              data: {
                rentalCode: await this.generateRentalCodeTx(tx),
                userId: order.userId,
                trackId: product.trackId,
                albumId: null,
                orderId: order.id,
                status: RentalStatus.ACTIVE,
                startsAt,
                expiresAt,
              },
            });
          }
          // Caso 2: produto de ÁLBUM → cria N rentals (todas as faixas publicadas)
          else if (product.albumId) {
            const albumTracks = await tx.track.findMany({
              where: {
                albumId: product.albumId,
                status: 'PUBLISHED',
              },
              select: { id: true },
            });

            for (let i = 0; i < albumTracks.length; i++) {
              await tx.rental.create({
                data: {
                  rentalCode: await this.generateRentalCodeTx(tx, i),
                  userId: order.userId,
                  trackId: albumTracks[i].id,
                  albumId: product.albumId,
                  orderId: order.id,
                  status: RentalStatus.ACTIVE,
                  startsAt,
                  expiresAt,
                },
              });
            }
          }
        }
      });
      this.logger.log(`Order ${order.id} paga → rentals criados`);
    } else if (
      payment.status === 'refunded' ||
      payment.status === 'charged_back'
    ) {
      await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.REFUNDED },
        }),
        this.prisma.rental.updateMany({
          where: { orderId: order.id },
          data: { status: RentalStatus.CANCELLED },
        }),
      ]);
      this.logger.log(`Order ${order.id} reembolsada → rentals cancelados`);
    } else if (
      payment.status === 'rejected' ||
      payment.status === 'cancelled'
    ) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.FAILED },
      });
    }
  }

  private async generateRentalCodeTx(
    tx: any,
    offset = 0,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JMM-AL-${year}-`;

    const last = await tx.rental.findFirst({
      where: { rentalCode: { startsWith: prefix } },
      orderBy: { rentalCode: 'desc' },
      select: { rentalCode: true },
    });

    let next = 1;
    if (last) {
      const num = parseInt(last.rentalCode.replace(prefix, ''), 10);
      if (!isNaN(num)) next = num + 1;
    }

    return `${prefix}${String(next + offset).padStart(6, '0')}`;
  }
}