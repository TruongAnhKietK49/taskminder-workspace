import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  NotificationType,
  ReminderStatus,
  TaskStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class RemindersSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private intervalTimer: NodeJS.Timeout | null = null;
  private startupTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    this.startupTimer = setTimeout(() => {
      void this.processDueReminders();
    }, 5_000);

    this.intervalTimer = setInterval(() => {
      void this.processDueReminders();
    }, 60_000);
  }

  onModuleDestroy() {
    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
    }
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  async processDueReminders(now = new Date()) {
    const dueReminders = await this.prisma.taskReminder.findMany({
      where: {
        status: ReminderStatus.PENDING,
        remindAt: { lte: now },
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            projectId: true,
            dueDate: true,
            project: {
              select: {
                workspaceId: true,
                name: true,
              },
            },
          },
        },
      },
      take: 100,
    });

    for (const reminder of dueReminders) {
      const claimed = await this.prisma.taskReminder.updateMany({
        where: {
          id: reminder.id,
          status: ReminderStatus.PENDING,
        },
        data: {
          status: ReminderStatus.SENT,
          sentAt: now,
        },
      });

      if (claimed.count !== 1) {
        continue;
      }

      if (
        reminder.task.status === TaskStatus.DONE ||
        reminder.task.status === TaskStatus.ARCHIVED
      ) {
        continue;
      }

      await this.notificationsService.createNotification({
        userId: reminder.userId,
        type: NotificationType.TASK_DUE_SOON,
        title: 'Task reminder',
        message: `Reminder for "${reminder.task.title}" in ${reminder.task.project.name}`,
        projectId: reminder.task.projectId,
        dedupeKey: `reminder:${reminder.id}`,
        metadata: {
          workspaceId: reminder.task.project.workspaceId,
          projectId: reminder.task.projectId,
          taskId: reminder.task.id,
        },
      });
    }

    const soonCutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dueTasks = await this.prisma.task.findMany({
      where: {
        status: {
          notIn: [TaskStatus.DONE, TaskStatus.ARCHIVED],
        },
        assigneeId: {
          not: null,
        },
        dueDate: {
          lte: soonCutoff,
        },
      },
      select: {
        id: true,
        title: true,
        projectId: true,
        assigneeId: true,
        dueDate: true,
        project: {
          select: {
            workspaceId: true,
            name: true,
          },
        },
      },
      take: 100,
    });

    for (const task of dueTasks) {
      if (!task.assigneeId || !task.dueDate) {
        continue;
      }

      const isOverdue = task.dueDate < now;
      const dayKey = task.dueDate.toISOString().slice(0, 10);
      const dedupeKey = isOverdue
        ? `overdue:${task.id}:${dayKey}`
        : `duesoon:${task.id}:${dayKey}`;

      await this.notificationsService.createNotification({
        userId: task.assigneeId,
        type: isOverdue
          ? NotificationType.TASK_OVERDUE
          : NotificationType.TASK_DUE_SOON,
        title: isOverdue ? 'Task overdue' : 'Task due within 24h',
        message: isOverdue
          ? `"${task.title}" is overdue in ${task.project.name}`
          : `"${task.title}" is due soon in ${task.project.name}`,
        projectId: task.projectId,
        dedupeKey,
        metadata: {
          workspaceId: task.project.workspaceId,
          projectId: task.projectId,
          taskId: task.id,
        },
      });
    }
  }
}
