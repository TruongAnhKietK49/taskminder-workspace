import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryNotificationsDto,
  ) {
    const result = await this.notificationsService.findAll(user.id, query);

    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data: result,
    };
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    const unreadCount = await this.notificationsService.getUnreadCount(user.id);

    return {
      success: true,
      message: 'Unread count retrieved successfully',
      data: {
        unreadCount,
      },
    };
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    const updatedCount = await this.notificationsService.markAllAsRead(user.id);

    return {
      success: true,
      message: 'All notifications marked as read',
      data: {
        updatedCount,
      },
    };
  }

  @Patch(':notificationId/read')
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ) {
    const notification = await this.notificationsService.markAsRead(
      user.id,
      notificationId,
    );

    return {
      success: true,
      message: 'Notification marked as read',
      data: {
        notification,
      },
    };
  }

  @Delete(':notificationId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ) {
    await this.notificationsService.remove(user.id, notificationId);

    return {
      success: true,
      message: 'Notification deleted successfully',
      data: null,
    };
  }
}
