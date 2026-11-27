import { NotificationType, TaskStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { RemindersSchedulerService } from './reminders-scheduler.service';

describe('RemindersSchedulerService', () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const taskId = '22222222-2222-2222-2222-222222222222';
  const projectId = '33333333-3333-3333-3333-333333333333';
  const workspaceId = '44444444-4444-4444-4444-444444444444';
  const reminderId = '55555555-5555-5555-5555-555555555555';

  let scheduler: RemindersSchedulerService;
  let findManyRemindersMock: jest.Mock;
  let updateManyRemindersMock: jest.Mock;
  let findManyTasksMock: jest.Mock;
  let createNotificationMock: jest.Mock;

  beforeEach(() => {
    findManyRemindersMock = jest.fn();
    updateManyRemindersMock = jest.fn();
    findManyTasksMock = jest.fn().mockResolvedValue([]);
    createNotificationMock = jest.fn().mockResolvedValue(null);

    const prismaMock = {
      taskReminder: {
        findMany: findManyRemindersMock,
        updateMany: updateManyRemindersMock,
      },
      task: {
        findMany: findManyTasksMock,
      },
    } as unknown as PrismaService;

    const notificationsMock = {
      createNotification: createNotificationMock,
    } as unknown as NotificationsService;

    scheduler = new RemindersSchedulerService(prismaMock, notificationsMock);
  });

  it('claims pending reminder atomically and skips duplicate if already claimed', async () => {
    findManyRemindersMock.mockResolvedValue([
      {
        id: reminderId,
        userId,
        task: {
          id: taskId,
          title: 'Deploy API',
          status: TaskStatus.IN_PROGRESS,
          projectId,
          dueDate: new Date('2026-11-28T10:00:00.000Z'),
          project: { workspaceId, name: 'Core' },
        },
      },
    ]);

    updateManyRemindersMock.mockResolvedValueOnce({ count: 0 });
    await scheduler.processDueReminders(new Date('2026-11-27T12:00:00.000Z'));
    expect(createNotificationMock).not.toHaveBeenCalled();

    updateManyRemindersMock.mockResolvedValueOnce({ count: 1 });
    await scheduler.processDueReminders(new Date('2026-11-27T12:00:00.000Z'));
    expect(createNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        type: NotificationType.TASK_DUE_SOON,
        dedupeKey: `reminder:${reminderId}`,
      }),
    );
  });

  it('emits overdue notification with daily dedupeKey', async () => {
    findManyRemindersMock.mockResolvedValue([]);
    findManyTasksMock.mockResolvedValue([
      {
        id: taskId,
        title: 'Write tests',
        projectId,
        assigneeId: userId,
        dueDate: new Date('2026-11-26T12:00:00.000Z'),
        project: { workspaceId, name: 'Core' },
      },
    ]);

    await scheduler.processDueReminders(new Date('2026-11-27T12:00:00.000Z'));

    expect(createNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        type: NotificationType.TASK_OVERDUE,
        dedupeKey: `overdue:${taskId}:2026-11-26`,
      }),
    );
  });
});
