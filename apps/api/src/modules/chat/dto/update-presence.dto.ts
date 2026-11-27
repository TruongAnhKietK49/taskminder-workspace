import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PresenceStatus } from '../../../generated/prisma/client';

export class UpdatePresenceDto {
  @IsEnum(PresenceStatus)
  status!: PresenceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  statusMessage?: string | null;
}
