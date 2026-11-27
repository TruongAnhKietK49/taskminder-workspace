import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TASK_ACTIVITY_ACTIONS } from './constants/task.constants';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto';
import { TaskAccessService } from './task-access.service';
import { TaskActivitiesService } from './task-activities.service';

const TASK_COMMENT_SELECT = {
  id: true,
  taskId: true,
  authorId: true,
  content: true,
  editedAt: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
    },
  },
} as const;

@Injectable()
export class TaskCommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskAccessService: TaskAccessService,
    private readonly taskActivitiesService: TaskActivitiesService,
  ) {}

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

    return this.prisma.taskComment.findMany({
      where: {
        taskId,
      },
      select: TASK_COMMENT_SELECT,
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async create(
    workspaceId: string,
    projectId: string,
    taskId: string,
    currentUserId: string,
    dto: CreateTaskCommentDto,
  ) {
    await this.taskAccessService.assertCanContributeToTask(
      workspaceId,
      projectId,
      taskId,
      currentUserId,
    );

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    const comment = await this.prisma.taskComment.create({
      data: {
        taskId,
        authorId: currentUserId,
        content,
      },
      select: TASK_COMMENT_SELECT,
    });

    await this.taskActivitiesService.record({
      taskId,
      actorId: currentUserId,
      action: TASK_ACTIVITY_ACTIONS.COMMENT_ADDED,
      newValue: {
        commentId: comment.id,
        preview: content.slice(0, 120),
      },
    });

    return comment;
  }

  async update(
    workspaceId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    currentUserId: string,
    dto: UpdateTaskCommentDto,
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

    const existing = await this.prisma.taskComment.findFirst({
      where: {
        id: commentId,
        taskId,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    if (existing.authorId !== currentUserId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    return this.prisma.taskComment.update({
      where: {
        id: commentId,
      },
      data: {
        content,
        editedAt: new Date(),
      },
      select: TASK_COMMENT_SELECT,
    });
  }

  async remove(
    workspaceId: string,
    projectId: string,
    taskId: string,
    commentId: string,
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

    const existing = await this.prisma.taskComment.findFirst({
      where: {
        id: commentId,
        taskId,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    if (existing.authorId !== currentUserId) {
      const isManager = await this.taskAccessService.isWorkspaceManager(
        workspaceId,
        currentUserId,
      );

      if (!isManager) {
        throw new ForbiddenException('You can only delete your own comments');
      }
    }

    await this.prisma.taskComment.delete({
      where: {
        id: commentId,
      },
    });
  }
}
