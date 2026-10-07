import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { IsISRC, IsUPC } from '../../../common/validators/isrc-upc.validator';

export class UpdateTrackDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

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