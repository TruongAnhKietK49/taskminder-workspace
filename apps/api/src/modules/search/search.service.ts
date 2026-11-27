import { Injectable } from '@nestjs/common';
import { ConversationType, TaskStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async searchWorkspace(
    workspaceId: string,
    currentUserId: string,
    rawQuery = '',
  ) {
    await this.workspaceAccessService.assertMember(workspaceId, currentUserId);

    const q = rawQuery.trim();
    if (q.length < 2) {
      return {
        query: q,
        totalCount: 0,
        projects: [],
        tasks: [],
        comments: [],
        messages: [],
        members: [],
      };
    }

    const visibleProjectsWhere =
      await this.projectAccessService.getVisibleProjectsWhere(
        workspaceId,
        currentUserId,
      );

    const [projects, tasks, comments, messages, members] = await Promise.all([
      this.prisma.project.findMany({
        where: {
          ...visibleProjectsWhere,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          status: true,
          description: true,
        },
        take: 6,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.task.findMany({
        where: {
          project: visibleProjectsWhere,
          status: { not: TaskStatus.ARCHIVED },
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          projectId: true,
          project: {
            select: { name: true },
          },
        },
        take: 6,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.taskComment.findMany({
        where: {
          content: { contains: q, mode: 'insensitive' },
          task: {
            project: visibleProjectsWhere,
          },
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          task: {
            select: {
              id: true,
              title: true,
              projectId: true,
            },
          },
          author: {
            select: {
              fullName: true,
            },
          },
        },
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.message.findMany({
        where: {
          deletedAt: null,
          content: { contains: q, mode: 'insensitive' },
          conversation: {
            workspaceId,
            OR: [
              { type: ConversationType.WORKSPACE },
              {
                type: ConversationType.PROJECT,
                project: visibleProjectsWhere,
              },
              {
                type: ConversationType.DIRECT,
                members: {
                  some: { userId: currentUserId },
                },
              },
            ],
          },
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          conversationId: true,
          conversation: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          sender: {
            select: {
              fullName: true,
            },
          },
        },
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          user: {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        take: 6,
      }),
    ]);

    const totalCount =
      projects.length +
      tasks.length +
      comments.length +
      messages.length +
      members.length;

    return {
      query: q,
      totalCount,
      projects,
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        projectId: t.projectId,
        projectName: t.project.name,
      })),
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        taskId: c.task.id,
        taskTitle: c.task.title,
        projectId: c.task.projectId,
        authorName: c.author.fullName,
      })),
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        conversationId: m.conversationId,
        conversationName: m.conversation.name ?? m.conversation.type,
        conversationType: m.conversation.type,
        senderName: m.sender.fullName,
      })),
      members: members.map((m) => ({
        memberId: m.id,
        role: m.role,
        userId: m.user.id,
        fullName: m.user.fullName,
        email: m.user.email,
      })),
    };
  }
}
