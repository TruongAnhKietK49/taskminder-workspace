import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  TaskPriority,
  TaskStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto, QueryWorkspaceTasksDto } from './dto/query-tasks.dto';
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

const WORKSPACE_TASK_SELECT = {
  ...TASK_SELECT,
  project: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
} as const;

type WorkspaceTaskWithDetails = Prisma.TaskGetPayload<{
  select: typeof WORKSPACE_TASK_SELECT;
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

    await this.taskAccessService.assertCanAssignTask(
      workspaceId,
      currentUserId,
      dto.assigneeId,
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

  async findAll(
    workspaceId: string,
    projectId: string,
    currentUserId: string,
    query: QueryTasksDto = {},
  ) {
    await this.taskAccessService.assertCanReadProjectTasks(
      workspaceId,
      projectId,
      currentUserId,
    );

    const where: Prisma.TaskWhereInput = {
      ...this.buildTaskFilters(query, currentUserId),
      projectId,
      project: {
        workspaceId,
      },
    };

    const tasks = await this.prisma.task.findMany({
      where,
      select: TASK_SELECT,
      orderBy: this.buildTaskOrderBy(query),
    });

    return tasks.map((task) => this.toTaskResponse(task));
  }

  async findWorkspaceTasks(
    workspaceId: string,
    currentUserId: string,
    query: QueryWorkspaceTasksDto = {},
  ) {
    const visibleProjectWhere =
      await this.taskAccessService.getVisibleProjectsWhere(
        workspaceId,
        currentUserId,
      );

    const where: Prisma.TaskWhereInput = {
      ...this.buildTaskFilters(query, currentUserId),
      project: visibleProjectWhere,
      ...(query.projectId ? { projectId: query.projectId } : {}),
    };

    const tasks = await this.prisma.task.findMany({
      where,
      select: WORKSPACE_TASK_SELECT,
      orderBy: this.buildTaskOrderBy(query),
    });

    return tasks.map((task) => this.toWorkspaceTaskResponse(task));
  }

  async getWorkspaceTaskSummary(workspaceId: string, currentUserId: string) {
    const visibleProjectWhere =
      await this.taskAccessService.getVisibleProjectsWhere(
        workspaceId,
        currentUserId,
      );

    const tasks = await this.prisma.task.findMany({
      where: {
        project: visibleProjectWhere,
        status: {
          not: TaskStatus.ARCHIVED,
        },
      },
      select: {
        status: true,
        priority: true,
        dueDate: true,
        assigneeId: true,
      },
    });

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const byStatus: Record<
      Exclude<TaskStatus, typeof TaskStatus.ARCHIVED>,
      number
    > = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.REVIEW]: 0,
      [TaskStatus.DONE]: 0,
      [TaskStatus.BLOCKED]: 0,
    };

    const byPriority: Record<TaskPriority, number> = {
      [TaskPriority.LOW]: 0,
      [TaskPriority.MEDIUM]: 0,
      [TaskPriority.HIGH]: 0,
      [TaskPriority.URGENT]: 0,
    };

    let assignedToMe = 0;
    let overdue = 0;
    let dueSoon = 0;

    for (const task of tasks) {
      if (task.status !== TaskStatus.ARCHIVED) {
        byStatus[task.status] += 1;
      }

      byPriority[task.priority] += 1;

      if (task.status !== TaskStatus.DONE) {
        if (task.assigneeId === currentUserId) {
          assignedToMe += 1;
        }

        if (task.dueDate !== null) {
          if (task.dueDate < now) {
            overdue += 1;
          } else if (task.dueDate <= sevenDaysLater) {
            dueSoon += 1;
          }
        }
      }
    }

    return {
      totalActive: tasks.length,
      byStatus,
      byPriority,
      assignedToMe,
      overdue,
      dueSoon,
    };
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
    const existingTask = await this.taskAccessService.assertCanUpdateTask(
      workspaceId,
      projectId,
      taskId,
      currentUserId,
    );

    if (dto.assigneeId !== undefined) {
      await this.taskAccessService.assertCanAssignTask(
        workspaceId,
        currentUserId,
        dto.assigneeId,
        existingTask.assigneeId,
      );
    }

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
      updateData.description = dto.description?.trim() || null;
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

  private buildTaskFilters(
    query: QueryTasksDto | QueryWorkspaceTasksDto,
    currentUserId: string,
  ): Prisma.TaskWhereInput {
    const where: Prisma.TaskWhereInput = {};

    if (query.status !== undefined) {
      where.status = query.status;
    } else if (!query.includeArchived) {
      where.status = {
        not: TaskStatus.ARCHIVED,
      };
    }

    if (query.priority !== undefined) {
      where.priority = query.priority;
    }

    if (query.unassigned === true) {
      where.assigneeId = null;
    } else if ('assignedToMe' in query && query.assignedToMe === true) {
      where.assigneeId = currentUserId;
    } else if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }

    const search = query.search?.trim();
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return where;
  }

  private buildTaskOrderBy(
    query: QueryTasksDto,
  ): Prisma.TaskOrderByWithRelationInput[] {
    if (!query.sortBy) {
      return [{ dueDate: 'asc' }, { updatedAt: 'desc' }];
    }

    const order =
      query.sortOrder ?? (query.sortBy === 'dueDate' ? 'asc' : 'desc');

    if (query.sortBy === 'updatedAt') {
      return [{ updatedAt: order }];
    }

    return [{ [query.sortBy]: order }, { updatedAt: 'desc' }];
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

  private toWorkspaceTaskResponse(task: WorkspaceTaskWithDetails) {
    return {
      ...this.toTaskResponse(task),
      project: task.project,
    };
  }
}
