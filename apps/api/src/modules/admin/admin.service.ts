import { Injectable } from '@nestjs/common';
import { SubscriptionStatus, RentalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPagination, Paginated } from '../../common/pagination';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------
  // DASHBOARD
  // ----------------------------------------------------------
  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisMonth,
      totalTracks,
      publishedTracks,
      totalAlbums,
      activeSubscriptions,
      activeRentals,
      playsLast30Days,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.track.count(),
      this.prisma.track.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.album.count(),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE, currentPeriodEnd: { gt: now } },
      }),
      this.prisma.rental.count({
        where: { status: RentalStatus.ACTIVE, expiresAt: { gt: now } },
      }),
      this.prisma.playbackEvent.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    // Receita estimada (pedidos pagos no mês)
    const paidOrdersThisMonth = await this.prisma.order.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: startOfMonth },
      },
      _sum: { totalCents: true },
      _count: true,
    });

    return {
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
      },
      catalog: {
        albums: totalAlbums,
        tracks: totalTracks,
        publishedTracks,
      },
      revenue: {
        monthCents: paidOrdersThisMonth._sum.totalCents ?? 0,
        monthOrders: paidOrdersThisMonth._count,
      },
      activity: {
        activeSubscriptions,
        activeRentals,
        playsLast30Days,
      },
    };
  }

  // ----------------------------------------------------------
  // USUÁRIOS
  // ----------------------------------------------------------
  async listUsers(query: ListUsersQueryDto): Promise<Paginated<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { name: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              subscriptions: true,
              rentals: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data, meta: buildPagination(page, limit, total) };
  }

  async updateUserRole(userId: string, role: 'CUSTOMER' | 'ADMIN') {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  // ----------------------------------------------------------
  // ASSINATURAS
  // ----------------------------------------------------------
  async listSubscriptions() {
    return this.prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, email: true, name: true } },
        plan: { select: { id: true, name: true, priceCents: true } },
      },
    });
  }

  // ----------------------------------------------------------
  // ALUGUÉIS
  // ----------------------------------------------------------
  async listRentals() {
    return this.prisma.rental.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, email: true, name: true } },
        track: { select: { id: true, title: true, slug: true } },
        album: { select: { id: true, title: true, slug: true } },
      },
    });
  }

  // ----------------------------------------------------------
  // TOP TRACKS (relatório)
  // ----------------------------------------------------------
  async getTopTracks(limit = 20) {
    const grouped = await this.prisma.playbackEvent.groupBy({
      by: ['trackId'],
      _count: { trackId: true },
      orderBy: { _count: { trackId: 'desc' } },
      take: limit,
    });

    const trackIds = grouped.map((g) => g.trackId);
    const tracks = await this.prisma.track.findMany({
      where: { id: { in: trackIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        album: { select: { title: true, coverUrl: true } },
      },
    });

    const trackMap = new Map(tracks.map((t) => [t.id, t]));

    return grouped.map((g) => ({
      track: trackMap.get(g.trackId) ?? null,
      plays: g._count.trackId,
    }));
  }
}