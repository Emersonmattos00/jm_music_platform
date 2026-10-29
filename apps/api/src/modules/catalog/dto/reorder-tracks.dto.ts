import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsUUID,
} from 'class-validator';

export class ReorderTracksDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  orderedIds!: string[];
}