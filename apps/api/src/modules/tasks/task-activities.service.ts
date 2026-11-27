import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskAccessService } from './task-access.service';

const TASK_ACTIVITY_SELECT = {
  id: true,
  taskId: true,
  actorId: true,
  action: true,
  oldValue: true,
  newValue: true,
  createdAt: true,
  actor: {
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
    },
  },
} as const;

export type RecordTaskActivityInput = {
  taskId: string;
  actorId: string;
  action: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
};

@Injectable()
export class TaskActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskAccessService: TaskAccessService,
  ) {}

  async record(input: RecordTaskActivityInput) {
    const data: Prisma.TaskActivityUncheckedCreateInput = {
      taskId: input.taskId,
      actorId: input.actorId,
      action: input.action,
    };

    if (input.oldValue !== undefined) {
      data.oldValue = input.oldValue;
    }

    if (input.newValue !== undefined) {
      data.newValue = input.newValue;
    }

    return this.prisma.taskActivity.create({
      data,
      select: TASK_ACTIVITY_SELECT,
    });
  }

  async findAll(
    workspaceId: string,
    projectId: string,
    taskId: string,
    currentUserId: string,
  ) {
    await this.taskAccessService.assertCanReadProjectTasks(
      workspaceId,
      projectId,
      currentUserId,
    );

    await this.taskAccessService.assertTaskExists(
      workspaceId,
      projectId,
      taskId,
    );

    return this.prisma.taskActivity.findMany({
      where: {
        taskId,
      },
      select: TASK_ACTIVITY_SELECT,
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }
}
