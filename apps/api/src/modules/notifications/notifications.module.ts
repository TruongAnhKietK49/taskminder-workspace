import { Global, Module } from '@nestjs/common';
import { NotificationSettingsController } from './notification-settings.controller';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { RemindersSchedulerService } from './reminders-scheduler.service';

@Global()
@Module({
  controllers: [NotificationsController, NotificationSettingsController],
  providers: [
    NotificationsService,
    NotificationSettingsService,
    RemindersSchedulerService,
  ],
  exports: [NotificationsService, NotificationSettingsService],
})
export class NotificationsModule {}
