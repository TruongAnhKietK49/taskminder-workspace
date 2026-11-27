import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { NotificationType } from '../../../generated/prisma/client';

export class QueryNotificationsDto {
  @IsOptional()
  @IsIn(['all', 'unread'])
  filter?: 'all' | 'unread';

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
