import { IsIn, IsUUID } from 'class-validator';

export class CreateTrackRentalOrderDto {
  @IsUUID()
  productId!: string;
}

export class CreateAlbumRentalOrderDto {
  @IsUUID()
  albumId!: string;

  @IsIn([24, 48, 72, 120, 240, 360])
  durationHours!: number;
}