import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  TaskPriority,
  TaskStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskAccessService } from './task-access.service';

const TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  projectId: true,
  createdById: true,
  assigneeId: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
    },
  },
  assignee: {
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
    },
  },
} as const;

type TaskWithDetails = Prisma.TaskGetPayload<{
  select: typeof TASK_SELECT;
}>;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskAccessService: TaskAccessService,
  ) {}

  async create(
    workspaceId: string,
    projectId: string,
    currentUserId: string,
    dto: CreateTaskDto,
  ) {
    await this.taskAccessService.assertCanCreateTask(
      workspaceId,
      projectId,
      currentUserId,
    );

    await this.taskAccessService.assertAssigneeIsProjectMember(
      projectId,
      dto.assigneeId,
    );

    const task = await this.prisma.task.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        status: dto.status ?? TaskStatus.TODO,
        priority: dto.priority ?? TaskPriority.MEDIUM,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        projectId,
        createdById: currentUserId,
        assigneeId: dto.assigneeId ?? null,
      },
      select: TASK_SELECT,
    });

    return this.toTaskResponse(task);
  }

  async findAll(workspaceId: string, projectId: string, currentUserId: string) {
    await this.taskAccessService.assertCanReadProjectTasks(
      workspaceId,
      projectId,
      currentUserId,
    );

    const tasks = await this.prisma.task.findMany({
      where: {
        projectId,
        project: {
          workspaceId,
        },
        status: {
          not: TaskStatus.ARCHIVED,
        },
      },
      select: TASK_SELECT,
      orderBy: [
        {
          dueDate: 'asc',
        },
        {
          updatedAt: 'desc',
        },
      ],
    });

    return tasks.map((task) => this.toTaskResponse(task));
  }

  async findOne(
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

    const task = await this.findTaskOrThrow(workspaceId, projectId, taskId);

    return this.toTaskResponse(task);
  }

  async update(
    workspaceId: string,
    projectId: string,
    taskId: string,
    currentUserId: string,
    dto: UpdateTaskDto,
  ) {
    await this.taskAccessService.assertCanUpdateTask(
      workspaceId,
      projectId,
      taskId,
      currentUserId,
    );

    await this.taskAccessService.assertAssigneeIsProjectMember(
      projectId,
      dto.assigneeId,
    );

    const updateData: {
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate?: Date | null;
      assigneeId?: string | null;
    } = {};

    if (dto.title !== undefined) {
      updateData.title = dto.title.trim();
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description.trim() || null;
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    if (dto.priority !== undefined) {
      updateData.priority = dto.priority;
    }

    if (dto.dueDate !== undefined) {
      updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    if (dto.assigneeId !== undefined) {
      updateData.assigneeId = dto.assigneeId || null;
    }

    const task = await this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: updateData,
      select: TASK_SELECT,
    });

    return this.toTaskResponse(task);
  }

  async archive(
    workspaceId: string,
    projectId: string,
    taskId: string,
    currentUserId: string,
  ) {
    await this.taskAccessService.assertCanDeleteTask(
      workspaceId,
      projectId,
      taskId,
      currentUserId,
    );

    const task = await this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status: TaskStatus.ARCHIVED,
      },
      select: TASK_SELECT,
    });

    return this.toTaskResponse(task);
  }

  private async findTaskOrThrow(
    workspaceId: string,
    projectId: string,
    taskId: string,
  ) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
        project: {
          workspaceId,
        },
      },
      select: TASK_SELECT,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private toTaskResponse(task: TaskWithDetails) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      projectId: task.projectId,
      createdById: task.createdById,
      assigneeId: task.assigneeId,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      createdBy: task.createdBy,
      assignee: task.assignee,
    };
  }
}
