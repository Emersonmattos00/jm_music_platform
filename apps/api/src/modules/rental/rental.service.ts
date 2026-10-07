import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  ProductType,
  RentalStatus,
  SubscriptionStatus,
  TrackStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Fallback de preços por duração.
 * Fonte de verdade = RentalProduct no banco.
 * Este map só é usado se o RentalProduct não existir (ex: seed antigo).
 */
const FALLBACK_ALBUM_PRICES: Record<number, number> = {
  24: 1290,
  48: 1990,
  72: 2990,
  120: 3990,
  240: 4990,
  360: 6990,
};

@Injectable()
export class RentalService {
  private readonly logger = new Logger(RentalService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------
  // PRODUTOS
  // ----------------------------------------------------------
  async listTrackRentalProducts(trackId: string) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true },
    });
    if (!track) throw new NotFoundException('Faixa não encontrada');

    return this.prisma.rentalProduct.findMany({
      where: { trackId, active: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        durationHours: true,
        priceCents: true,
        currency: true,
      },
    });
  }

  async listAlbumRentalProducts(albumId: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      select: { id: true },
    });
    if (!album) throw new NotFoundException('Álbum não encontrado');

    const products = await this.prisma.rentalProduct.findMany({
      where: { albumId, active: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        durationHours: true,
        priceCents: true,
        currency: true,
      },
    });

    if (products.length > 0) return products;

    return Object.entries(FALLBACK_ALBUM_PRICES).map(([hours, price]) => ({
      id: `${hours}h`,
      name: this.humanDuration(Number(hours)),
      durationHours: Number(hours),
      priceCents: price,
      currency: 'BRL',
    }));
  }

  // ----------------------------------------------------------
  // HELPERS DE VALIDAÇÃO
  // ----------------------------------------------------------
  private async hasActiveSubscription(userId: string): Promise<boolean> {
    const sub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { gt: new Date() },
      },
      select: { id: true },
    });
    return !!sub;
  }

  private async findActiveRental(
    userId: string,
    trackId?: string,
    albumId?: string,
  ) {
    const OR: any[] = [];
    if (trackId) OR.push({ trackId });
    if (albumId) OR.push({ albumId });
    if (OR.length === 0) return null;

    return this.prisma.rental.findFirst({
      where: {
        userId,
        status: RentalStatus.ACTIVE,
        expiresAt: { gt: new Date() },
        OR,
      },
      select: {
        id: true,
        rentalCode: true,
        expiresAt: true,
        trackId: true,
        albumId: true,
      },
    });
  }

  private async assertCanRentTrack(userId: string, trackId: string) {
    if (await this.hasActiveSubscription(userId)) {
      throw new BadRequestException(
        'Você tem assinatura ativa e já pode ouvir esta faixa. Não é preciso alugar.',
      );
    }
    const existing = await this.findActiveRental(userId, trackId);
    if (existing) {
      const data = existing.expiresAt.toLocaleDateString('pt-BR');
      throw new BadRequestException(
        `Você já alugou esta faixa. Expira em ${data}.`,
      );
    }
  }

  private async assertCanRentAlbum(userId: string, albumId: string) {
    if (await this.hasActiveSubscription(userId)) {
      throw new BadRequestException(
        'Você tem assinatura ativa e já pode ouvir este álbum. Não é preciso alugar.',
      );
    }
    const existing = await this.findActiveRental(userId, undefined, albumId);
    if (existing) {
      const data = existing.expiresAt.toLocaleDateString('pt-BR');
      throw new BadRequestException(
        `Você já alugou este álbum. Expira em ${data}.`,
      );
    }
  }

  // ----------------------------------------------------------
  // CRIAR PEDIDO DE FAIXA
  // ----------------------------------------------------------
  async createTrackRentalOrder(
    userId: string,
    productId: string,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const existing = await this.prisma.order.findUnique({
        where: { idempotencyKey },
        select: {
          id: true,
          status: true,
          totalCents: true,
          currency: true,
          createdAt: true,
          items: {
            select: {
              productId: true,
              productType: true,
              unitPriceCents: true,
            },
          },
        },
      });

      if (existing) {
        const product = existing.items[0]?.productId
          ? await this.prisma.rentalProduct.findUnique({
              where: { id: existing.items[0].productId },
              select: {
                id: true,
                name: true,
                durationHours: true,
                priceCents: true,
                trackId: true,
              },
            })
          : null;

        const track = product?.trackId
          ? await this.prisma.track.findUnique({
              where: { id: product.trackId },
              select: { id: true, title: true },
            })
          : null;

        return {
          order: {
            id: existing.id,
            status: existing.status,
            totalCents: existing.totalCents,
            currency: existing.currency,
            createdAt: existing.createdAt,
          },
          product: product
            ? {
                id: product.id,
                name: product.name,
                durationHours: product.durationHours,
                priceCents: product.priceCents,
              }
            : null,
          track,
          idempotent: true,
        };
      }
    }

    const product = await this.prisma.rentalProduct.findUnique({
      where: { id: productId },
      include: { track: { select: { id: true, title: true, status: true } } },
    });

    if (!product || !product.active || !product.trackId || !product.track) {
      throw new NotFoundException('Produto de aluguel não encontrado');
    }
    if (product.track.status !== TrackStatus.PUBLISHED) {
      throw new BadRequestException('Faixa não está publicada');
    }

    await this.assertCanRentTrack(userId, product.trackId);

    const finalKey =
      idempotencyKey ?? `rental-track-${userId}-${productId}-${Date.now()}`;

    const order = await this.prisma.order.create({
      data: {
        userId,
        status: OrderStatus.PENDING,
        totalCents: product.priceCents,
        currency: product.currency,
        idempotencyKey: finalKey,
        items: {
          create: [
            {
              productType: ProductType.RENTAL,
              productId: product.id,
              quantity: 1,
              unitPriceCents: product.priceCents,
            },
          ],
        },
      },
      select: {
        id: true,
        status: true,
        totalCents: true,
        currency: true,
        createdAt: true,
      },
    });

    return {
      order,
      product: {
        id: product.id,
        name: product.name,
        durationHours: product.durationHours,
        priceCents: product.priceCents,
      },
      track: {
        id: product.track.id,
        title: product.track.title,
      },
      idempotent: false,
    };
  }

  // ----------------------------------------------------------
  // CRIAR PEDIDO DE ÁLBUM
  // ----------------------------------------------------------
  async createAlbumRentalOrder(
    userId: string,
    albumId: string,
    durationHours: number,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const existing = await this.prisma.order.findUnique({
        where: { idempotencyKey },
        select: {
          id: true,
          status: true,
          totalCents: true,
          currency: true,
          createdAt: true,
        },
      });

      if (existing) {
        const album = await this.prisma.album.findUnique({
          where: { id: albumId },
          select: {
            id: true,
            title: true,
            _count: {
              select: {
                tracks: { where: { status: TrackStatus.PUBLISHED } },
              },
            },
          },
        });

        return {
          order: {
            id: existing.id,
            status: existing.status,
            totalCents: existing.totalCents,
            currency: existing.currency,
            createdAt: existing.createdAt,
          },
          album: album
            ? {
                id: album.id,
                title: album.title,
                trackCount: album._count.tracks,
                durationHours,
                priceCents: existing.totalCents,
              }
            : null,
          idempotent: true,
        };
      }
    }

    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      include: {
        tracks: {
          where: { status: TrackStatus.PUBLISHED },
          select: { id: true },
        },
      },
    });

    if (!album) throw new NotFoundException('Álbum não encontrado');
    if (album.tracks.length === 0) {
      throw new BadRequestException('Álbum sem faixas publicadas');
    }

    // Busca o RentalProduct (produto do álbum)
    let product = await this.prisma.rentalProduct.findFirst({
      where: { albumId, durationHours, active: true },
      select: { id: true, priceCents: true, currency: true },
    });

    // Fallback: se não existir produto, cria um com preço hardcoded
    if (!product) {
      const fallbackPrice = FALLBACK_ALBUM_PRICES[durationHours];
      if (!fallbackPrice) {
        throw new BadRequestException('Duração inválida');
      }

      product = await this.prisma.rentalProduct.create({
        data: {
          albumId,
          name: this.humanDuration(durationHours),
          durationHours,
          priceCents: fallbackPrice,
          currency: 'BRL',
          active: true,
          sortOrder: this.sortOrderForHours(durationHours),
        },
        select: { id: true, priceCents: true, currency: true },
      });
    }

    await this.assertCanRentAlbum(userId, albumId);

    const finalKey =
      idempotencyKey ??
      `rental-album-${userId}-${albumId}-${durationHours}-${Date.now()}`;

    // 1 OrderItem apontando pro RentalProduct (não pra Track)
    const order = await this.prisma.order.create({
      data: {
        userId,
        status: OrderStatus.PENDING,
        totalCents: product.priceCents,
        currency: product.currency,
        idempotencyKey: finalKey,
        items: {
          create: [
            {
              productType: ProductType.RENTAL,
              productId: product.id,
              quantity: 1,
              unitPriceCents: product.priceCents,
            },
          ],
        },
      },
      select: {
        id: true,
        status: true,
        totalCents: true,
        currency: true,
        createdAt: true,
      },
    });

    return {
      order,
      album: {
        id: album.id,
        title: album.title,
        trackCount: album.tracks.length,
        durationHours,
        priceCents: product.priceCents,
      },
      idempotent: false,
    };
  }

  // ----------------------------------------------------------
  // MOCK PAY
  // ----------------------------------------------------------
  async mockPayTrack(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Pedido não encontrado');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Pedido já foi processado');
    }
    if (order.items.length !== 1) {
      throw new BadRequestException('Pedido inválido');
    }

    const item = order.items[0];
    if (!item || item.productType !== ProductType.RENTAL || !item.productId) {
      throw new BadRequestException('Pedido inválido');
    }

    const product = await this.prisma.rentalProduct.findUnique({
      where: { id: item.productId },
    });
    if (!product || !product.trackId) {
      throw new NotFoundException('Produto de faixa não encontrado');
    }

    const startsAt = new Date();
    const expiresAt = new Date(
      startsAt.getTime() + product.durationHours * 60 * 60 * 1000,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
          externalPaymentId: `mock-${Date.now()}`,
        },
      });

      const rental = await tx.rental.create({
        data: {
          rentalCode: await this.generateRentalCodeTx(tx),
          userId,
          trackId: product.trackId,
          albumId: null,
          orderId: order.id,
          status: RentalStatus.ACTIVE,
          startsAt,
          expiresAt,
        },
      });

      return { updatedOrder, rental };
    });

    return result;
  }

  async mockPayAlbum(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Pedido não encontrado');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Pedido já foi processado');
    }

    const item = order.items[0];
    if (!item || item.productType !== ProductType.RENTAL || !item.productId) {
      throw new BadRequestException('Pedido inválido');
    }

    const product = await this.prisma.rentalProduct.findUnique({
      where: { id: item.productId },
    });
    if (!product || !product.albumId) {
      throw new NotFoundException('Produto de álbum não encontrado');
    }

    const albumTracks = await this.prisma.track.findMany({
      where: { albumId: product.albumId, status: TrackStatus.PUBLISHED },
      select: { id: true },
    });

    if (albumTracks.length === 0) {
      throw new BadRequestException('Álbum sem faixas publicadas');
    }

    const startsAt = new Date();
    const expiresAt = new Date(
      startsAt.getTime() + product.durationHours * 60 * 60 * 1000,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
          externalPaymentId: `mock-album-${Date.now()}`,
        },
      });

      const rentals = [];
      for (let i = 0; i < albumTracks.length; i++) {
        const rental = await tx.rental.create({
          data: {
            rentalCode: await this.generateRentalCodeTx(tx, i),
            userId,
            trackId: albumTracks[i].id,
            albumId: product.albumId,
            orderId: order.id,
            status: RentalStatus.ACTIVE,
            startsAt,
            expiresAt,
          },
        });
        rentals.push(rental);
      }

      return { updatedOrder, rentals };
    });

    return {
      order: {
        id: result.updatedOrder.id,
        status: 'PAID',
        totalCents: result.updatedOrder.totalCents,
      },
      rentals: result.rentals.length,
      firstCode: result.rentals[0]?.rentalCode ?? null,
      expiresAt,
    };
  }

  // ----------------------------------------------------------
  // MINHA LISTA
  // ----------------------------------------------------------
  async listMyRentals(userId: string) {
    const now = new Date();

    const rentals = await this.prisma.rental.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            slug: true,
            album: { select: { id: true, title: true, slug: true } },
          },
        },
        album: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    return rentals.map((r) => {
      const isExpired =
        r.status === RentalStatus.ACTIVE &&
        r.expiresAt.getTime() < now.getTime();
      const effectiveStatus = isExpired ? 'EXPIRED' : r.status;

      return {
        id: r.id,
        rentalCode: r.rentalCode,
        status: effectiveStatus,
        startsAt: r.startsAt,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
        track: r.track,
        album: r.album,
      };
    });
  }

  // ----------------------------------------------------------
  // JOB: expira aluguéis vencidos
  // ----------------------------------------------------------
  async expireOutdatedRentals(): Promise<number> {
    const result = await this.prisma.rental.updateMany({
      where: {
        status: RentalStatus.ACTIVE,
        expiresAt: { lt: new Date() },
      },
      data: { status: RentalStatus.EXPIRED },
    });

    if (result.count > 0) {
      this.logger.log(`Expirou ${result.count} aluguel(is) vencido(s)`);
    }
    return result.count;
  }

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------
  private humanDuration(hours: number): string {
    if (hours < 24) return `${hours} horas`;
    if (hours === 24) return '24 horas';
    if (hours === 48) return '48 horas';
    const days = hours / 24;
    return `${days} dias`;
  }

  private sortOrderForHours(hours: number): number {
    const order = [24, 48, 72, 120, 240, 360];
    const idx = order.indexOf(hours);
    return idx >= 0 ? idx + 1 : 99;
  }

  private async generateRentalCodeTx(tx: any, offset = 0): Promise<string> {
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