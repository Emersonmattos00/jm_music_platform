import { IsIn, IsString, IsUUID, IsOptional, IsMimeType } from 'class-validator';

export const MEDIA_TYPES = ['master', 'stream', 'preview'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export class UploadUrlDto {
  @IsUUID()
  trackId!: string;

  @IsIn(MEDIA_TYPES as unknown as string[])
  type!: MediaType;

  @IsString()
  @IsMimeType()
  contentType!: string;
}