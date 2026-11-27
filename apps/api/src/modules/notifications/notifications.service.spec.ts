import { NotFoundException } from '@nestjs/common';
import { NotificationType } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService & NotificationSettingsService', () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const projectId = '22222222-2222-2222-2222-222222222222';
  const notificationId = '33333333-3333-3333-3333-333333333333';

  let settingsService: NotificationSettingsService;
  let notificationsService: NotificationsService;
  let upsertPrefMock: jest.Mock;
  let createNotifMock: jest.Mock;
  let findFirstNotifMock: jest.Mock;
  let updateNotifMock: jest.Mock;
  let updateManyNotifMock: jest.Mock;

  beforeEach(() => {
    upsertPrefMock = jest.fn();
    createNotifMock = jest.fn();
    findFirstNotifMock = jest.fn();
    updateNotifMock = jest.fn();
    updateManyNotifMock = jest.fn();

    const prismaMock = {
      notificationPreference: {
        upsert: upsertPrefMock,
      },
      notification: {
        create: createNotifMock,
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findFirst: findFirstNotifMock,
        update: updateNotifMock,
        updateMany: updateManyNotifMock,
        delete: jest.fn(),
      },
    } as unknown as PrismaService;

    settingsService = new NotificationSettingsService(prismaMock);
    notificationsService = new NotificationsService(
      prismaMock,
      settingsService,
    );
  });

  it('blocks delivery when doNotDisturb is enabled', async () => {
    upsertPrefMock.mockResolvedValue({
      doNotDisturb: true,
      quietHoursEnabled: false,
      mutedProjectIds: [],
      taskUpdatesEnabled: true,
      remindersEnabled: true,
      chatEnabled: true,
    });

    const allowed = await settingsService.shouldDeliver(
      userId,
      NotificationType.TASK_ASSIGNED,
    );

    expect(allowed).toBe(false);
  });

  it('checks overnight quiet hours window (22:00 - 07:00)', () => {
    const lateNight = new Date('2026-11-27T23:30:00');
    const earlyMorning = new Date('2026-11-27T06:15:00');
    const afternoon = new Date('2026-11-27T14:00:00');

    expect(settingsService.isInQuietHours('22:00', '07:00', lateNight)).toBe(
      true,
    );
    expect(settingsService.isInQuietHours('22:00', '07:00', earlyMorning)).toBe(
      true,
    );
    expect(settingsService.isInQuietHours('22:00', '07:00', afternoon)).toBe(
      false,
    );
  });

  it('blocks muted project notifications except MENTION', async () => {
    upsertPrefMock.mockResolvedValue({
      doNotDisturb: false,
      quietHoursEnabled: false,
      mutedProjectIds: [projectId],
      taskUpdatesEnabled: true,
      remindersEnabled: true,
      chatEnabled: true,
    });

    await expect(
      settingsService.shouldDeliver(
        userId,
        NotificationType.TASK_UPDATED,
        projectId,
      ),
    ).resolves.toBe(false);

    await expect(
      settingsService.shouldDeliver(
        userId,
        NotificationType.MENTION,
        projectId,
      ),
    ).resolves.toBe(true);
  });

  it('swallows P2002 duplicate errors on createNotification', async () => {
    upsertPrefMock.mockResolvedValue({
      doNotDisturb: false,
      quietHoursEnabled: false,
      mutedProjectIds: [],
      taskUpdatesEnabled: true,
      remindersEnabled: true,
      chatEnabled: true,
    });
    createNotifMock.mockRejectedValue({ code: 'P2002' });

    const result = await notificationsService.createNotification({
      userId,
      type: NotificationType.TASK_DUE_SOON,
      title: 'Due soon',
      message: 'Task is due',
      dedupeKey: 'duesoon:1:2026-11-27',
    });

    expect(result).toBeNull();
  });

  it('throws NotFoundException when marking missing notification as read', async () => {
    findFirstNotifMock.mockResolvedValue(null);

    await expect(
      notificationsService.markAsRead(userId, notificationId),
    ).rejects.toThrow(NotFoundException);
  });

  it('markAllAsRead returns updated count', async () => {
    updateManyNotifMock.mockResolvedValue({ count: 4 });

    const count = await notificationsService.markAllAsRead(userId);
    expect(count).toBe(4);
  });
});
