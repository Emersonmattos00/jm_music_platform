import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RentalService } from './rental.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import {
  CreateTrackRentalOrderDto,
  CreateAlbumRentalOrderDto,
} from './dto/create-rental-order.dto';

@Controller()
export class RentalController {
  constructor(private readonly rental: RentalService) {}

  // ---- Público

  @Get('tracks/:trackId/rental-products')
  listTrackProducts(@Param('trackId') trackId: string) {
    return this.rental.listTrackRentalProducts(trackId);
  }

  @Get('albums/:albumId/rental-products')
  listAlbumProducts(@Param('albumId') albumId: string) {
    return this.rental.listAlbumRentalProducts(albumId);
  }

  // ---- Autenticado + email verificado

  @Post('orders/rental')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  createTrackOrder(
    @Req() req: any,
    @Body() dto: CreateTrackRentalOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.rental.createTrackRentalOrder(
      req.user.id,
      dto.productId,
      idempotencyKey,
    );
  }

  @Post('orders/album-rental')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  createAlbumOrder(
    @Req() req: any,
    @Body() dto: CreateAlbumRentalOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.rental.createAlbumRentalOrder(
      req.user.id,
      dto.albumId,
      dto.durationHours,
      idempotencyKey,
    );
  }

  // ---- Mock pay (só dev — não precisa verificar email, já é dev)

  @Post('orders/:id/mock-pay-rental')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  mockPayTrack(@Req() req: any, @Param('id') id: string) {
    this.assertMockPayAllowed();
    return this.rental.mockPayTrack(req.user.id, id);
  }

  @Post('orders/:id/mock-pay-album-rental')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  mockPayAlbum(@Req() req: any, @Param('id') id: string) {
    this.assertMockPayAllowed();
    return this.rental.mockPayAlbum(req.user.id, id);
  }

  // ---- Listagem (não precisa verificar email)

  @Get('me/rentals')
  @UseGuards(JwtAuthGuard)
  listMyRentals(@Req() req: any) {
    return this.rental.listMyRentals(req.user.id);
  }

  private assertMockPayAllowed() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Pagamento simulado indisponível em produção.',
      );
    }
  }
}