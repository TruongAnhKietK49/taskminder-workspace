import { Injectable } from '@nestjs/common';
import { NotificationType } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

function parseMinutes(hhmm: string | null): number | null {
  if (!hhmm) {
    return null;
  }

  const parts = hhmm.split(':');
  if (parts.length !== 2) {
    return null;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

@Injectable()
export class NotificationSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getForUser(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async updateForUser(userId: string, dto: UpdateNotificationSettingsDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...dto,
      },
      update: dto,
    });
  }

  isInQuietHours(
    start: string | null,
    end: string | null,
    now = new Date(),
  ): boolean {
    const startMinutes = parseMinutes(start);
    const endMinutes = parseMinutes(end);

    if (startMinutes === null || endMinutes === null) {
      return false;
    }

    if (startMinutes === endMinutes) {
      return false;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    // Overnight window (e.g. 22:00 - 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  async shouldDeliver(
    userId: string,
    type: NotificationType,
    projectId?: string,
    now = new Date(),
  ): Promise<boolean> {
    const pref = await this.getForUser(userId);

    if (pref.doNotDisturb) {
      return false;
    }

    if (
      pref.quietHoursEnabled &&
      this.isInQuietHours(pref.quietHoursStart, pref.quietHoursEnd, now)
    ) {
      return false;
    }

    if (
      projectId &&
      pref.mutedProjectIds.includes(projectId) &&
      type !== NotificationType.MENTION
    ) {
      return false;
    }

    if (
      (type === NotificationType.TASK_ASSIGNED ||
        type === NotificationType.TASK_UPDATED) &&
      !pref.taskUpdatesEnabled
    ) {
      return false;
    }

    if (
      (type === NotificationType.TASK_DUE_SOON ||
        type === NotificationType.TASK_OVERDUE) &&
      !pref.remindersEnabled
    ) {
      return false;
    }

    if (type === NotificationType.CHAT_MESSAGE && !pref.chatEnabled) {
      return false;
    }

    return true;
  }
}
