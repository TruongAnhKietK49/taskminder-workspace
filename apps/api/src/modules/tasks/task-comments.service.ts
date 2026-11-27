import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { NotificationType } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
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
    @Optional() private readonly notificationsService?: NotificationsService,
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

    if (this.notificationsService) {
      await this.emitCommentNotifications(
        workspaceId,
        projectId,
        taskId,
        currentUserId,
        comment.author.fullName,
        content,
      );
    }

    return comment;
  }

  private async emitCommentNotifications(
    workspaceId: string,
    projectId: string,
    taskId: string,
    currentUserId: string,
    authorName: string,
    content: string,
  ) {
    const [task, members] = await Promise.all([
      this.prisma.task.findUnique({
        where: { id: taskId },
        select: { title: true, assigneeId: true, createdById: true },
      }),
      this.prisma.projectMember.findMany({
        where: { projectId },
        select: {
          user: {
            select: { id: true, fullName: true },
          },
        },
      }),
    ]);

    if (!task) {
      return;
    }

    const lowerContent = content.toLowerCase();
    const mentionedIds = new Set<string>();

    for (const member of members) {
      if (member.user.id === currentUserId) {
        continue;
      }

      if (lowerContent.includes(`@${member.user.fullName.toLowerCase()}`)) {
        mentionedIds.add(member.user.id);
        void this.notificationsService?.createNotification({
          userId: member.user.id,
          type: NotificationType.MENTION,
          title: `${authorName} mentioned you`,
          message: `On "${task.title}": ${content.slice(0, 100)}`,
          projectId,
          metadata: { workspaceId, projectId, taskId },
        });
      }
    }

    const watchers = new Set<string>();
    if (
      task.assigneeId &&
      task.assigneeId !== currentUserId &&
      !mentionedIds.has(task.assigneeId)
    ) {
      watchers.add(task.assigneeId);
    }
    if (
      task.createdById &&
      task.createdById !== currentUserId &&
      !mentionedIds.has(task.createdById)
    ) {
      watchers.add(task.createdById);
    }

    for (const watcherId of watchers) {
      void this.notificationsService?.createNotification({
        userId: watcherId,
        type: NotificationType.TASK_UPDATED,
        title: `New comment on "${task.title}"`,
        message: `${authorName}: ${content.slice(0, 100)}`,
        projectId,
        metadata: { workspaceId, projectId, taskId },
      });
    }
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
