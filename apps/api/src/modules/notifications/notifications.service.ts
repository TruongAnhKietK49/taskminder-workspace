import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationSettingsService } from './notification-settings.service';

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
  projectId?: string;
  dedupeKey?: string;
  skipPreferenceCheck?: boolean;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: NotificationSettingsService,
  ) {}

  async createNotification(input: CreateNotificationInput) {
    const allowed =
      input.skipPreferenceCheck ||
      (await this.settingsService.shouldDeliver(
        input.userId,
        input.type,
        input.projectId,
      ));

    if (!allowed) {
      return null;
    }

    const data: Prisma.NotificationUncheckedCreateInput = {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
    };

    if (input.metadata !== undefined) {
      data.metadata = input.metadata;
    }

    if (input.dedupeKey !== undefined) {
      data.dedupeKey = input.dedupeKey;
    }

    try {
      return await this.prisma.notification.create({ data });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        return null;
      }

      throw error;
    }
  }

  async findAll(userId: string, query: QueryNotificationsDto = {}) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.filter === 'unread' ? { isRead: false } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const existing = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  async remove(userId: string, notificationId: string) {
    const existing = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
