import { IsIn, IsString, IsUUID, MaxLength } from 'class-validator';
import { MEDIA_TYPES } from './upload-url.dto';

export class AttachMediaDto {
  @IsUUID()
  trackId!: string;

  @IsIn(MEDIA_TYPES as unknown as string[])
  type!: 'master' | 'stream' | 'preview';

  @IsString()
  @MaxLength(500)
  key!: string;
}