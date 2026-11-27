import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { NotificationSettingsService } from './notification-settings.service';

@Controller('notification-settings')
@UseGuards(JwtAuthGuard)
export class NotificationSettingsController {
  constructor(
    private readonly notificationSettingsService: NotificationSettingsService,
  ) {}

  @Get()
  async getSettings(@CurrentUser() user: AuthenticatedUser) {
    const settings = await this.notificationSettingsService.getForUser(user.id);

    return {
      success: true,
      message: 'Notification settings retrieved successfully',
      data: {
        settings,
      },
    };
  }

  @Patch()
  async updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    const settings = await this.notificationSettingsService.updateForUser(
      user.id,
      dto,
    );

    return {
      success: true,
      message: 'Notification settings updated successfully',
      data: {
        settings,
      },
    };
  }
}
