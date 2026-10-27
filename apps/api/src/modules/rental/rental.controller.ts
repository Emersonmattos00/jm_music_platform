import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { RentalService } from './rental.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTrackRentalOrderDto,
  CreateAlbumRentalOrderDto,
} from './dto/create-rental-order.dto';

@Controller()
export class RentalController {
  constructor(
    private readonly rental: RentalService,
    private readonly prisma: PrismaService,
  ) {}

  // ==========================================================
  // PRODUTOS
  // ==========================================================

  @Get('tracks/:trackId/rental-products')
  listTrackProducts(@Param('trackId') trackId: string) {
    return this.rental.listTrackRentalProducts(trackId);
  }

  @Get('albums/:albumId/rental-products')
  listAlbumProducts(@Param('albumId') albumId: string) {
    return this.rental.listAlbumRentalProducts(albumId);
  }

  // ==========================================================
  // CRIAR PEDIDOS
  // ==========================================================

  @Post('orders/rental')
  @UseGuards(JwtAuthGuard)
  createTrackOrder(
    @Body() dto: CreateTrackRentalOrderDto,
    @Req() req: any,
  ) {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    return this.rental.createTrackRentalOrder(
      req.user.id,
      dto.productId,
      idempotencyKey,
    );
  }

  @Post('orders/album-rental')
  @UseGuards(JwtAuthGuard)
  createAlbumOrder(
    @Body() dto: CreateAlbumRentalOrderDto,
    @Req() req: any,
  ) {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    return this.rental.createAlbumRentalOrder(
      req.user.id,
      dto.albumId,
      dto.durationHours,
      idempotencyKey,
    );
  }

  // ==========================================================
  // PAGAMENTO SIMULADO (MOCK)
  // ==========================================================

  @Post('orders/:id/mock-pay-rental')
  @UseGuards(JwtAuthGuard)
  mockPayTrack(@Param('id') id: string, @Req() req: any) {
    return this.rental.mockPayTrack(req.user.id, id);
  }

  @Post('orders/:id/mock-pay-album-rental')
  @UseGuards(JwtAuthGuard)
  mockPayAlbum(@Param('id') id: string, @Req() req: any) {
    return this.rental.mockPayAlbum(req.user.id, id);
  }

  // ==========================================================
  // MEUS ALUGUÉIS
  // ==========================================================

  @Get('me/rentals')
  @UseGuards(JwtAuthGuard)
  listMyRentals(@Req() req: any) {
    return this.rental.listMyRentals(req.user.id);
  }

  // ==========================================================
  // STATUS DO PEDIDO (PARA A PÁGINA DE SUCESSO) — NOVO
  // ==========================================================

  @Get('orders/:id/status')
  @UseGuards(JwtAuthGuard)
  async getOrderStatus(@Param('id') id: string, @Req() req: any) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true },
    });

    if (!order || order.userId !== req.user.id) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return { id: order.id, status: order.status };
  }
}