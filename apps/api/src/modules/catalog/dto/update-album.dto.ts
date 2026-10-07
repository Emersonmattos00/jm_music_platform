import {
  IsString,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { IsUPC } from '../../../common/validators/isrc-upc.validator';

export class UpdateAlbumDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsUPC()
  upc?: string;

  @IsOptional()
  @IsDateString()
  releaseDate?: string;
}