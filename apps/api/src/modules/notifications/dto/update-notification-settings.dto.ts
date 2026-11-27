import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  taskUpdatesEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  remindersEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  chatEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  doNotDisturb?: boolean;

  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'quietHoursStart must be in HH:mm format',
  })
  quietHoursStart?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'quietHoursEnd must be in HH:mm format',
  })
  quietHoursEnd?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  mutedProjectIds?: string[];
}
