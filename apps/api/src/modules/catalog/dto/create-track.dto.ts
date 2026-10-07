import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  MinLength,
  IsUUID,
} from 'class-validator';
import { IsISRC, IsUPC } from '../../../common/validators/isrc-upc.validator';

export class CreateTrackDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsUUID()
  albumId?: string;

  @IsOptional()
  @IsUUID()
  artistId?: string;

  @IsOptional()
  @IsISRC()
  isrc?: string;

  @IsOptional()
  @IsUPC()
  upc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  genre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  mood?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}