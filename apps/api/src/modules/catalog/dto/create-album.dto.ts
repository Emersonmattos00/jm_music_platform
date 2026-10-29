import {
  IsString,
  IsOptional,
  IsDateString,
  IsUrl,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { IsUPC } from '../../../common/validators/isrc-upc.validator';

export class CreateAlbumDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  coverUrl?: string;

  @IsOptional()
  @IsUPC()
  upc?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  releaseDate?: string;

  @IsOptional()
  @IsUUID()
  artistId?: string;
}