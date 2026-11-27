import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  ConversationType,
  MessageType,
  NotificationType,
  WorkspaceRole,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service';
import { QueryMessagesDto } from './dto/query-messages.dto';

const CHAT_USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  avatarUrl: true,
} as const;

const MESSAGE_SELECT = {
  id: true,
  conversationId: true,
  senderId: true,
  type: true,
  content: true,
  editedAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  sender: {
    select: CHAT_USER_SELECT,
  },
} as const;

export type FormattedChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
};

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
    private readonly projectAccessService: ProjectAccessService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  async listConversations(workspaceId: string, currentUserId: string) {
    await this.workspaceAccessService.assertMember(workspaceId, currentUserId);

    const generalChannel = await this.ensureGeneralChannel(
      workspaceId,
      currentUserId,
    );

    const visibleWhere =
      await this.projectAccessService.getVisibleProjectsWhere(
        workspaceId,
        currentUserId,
      );

    const visibleProjects = await this.prisma.project.findMany({
      where: visibleWhere,
      select: {
        id: true,
        name: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const projectChannels = await Promise.all(
      visibleProjects.map((project) =>
        this.ensureProjectChannel(
          workspaceId,
          project.id,
          project.name,
          currentUserId,
        ),
      ),
    );

    const allowedChannelIds = [
      generalChannel.id,
      ...projectChannels.map((channel) => channel.id),
    ];

    const conversations = await this.prisma.conversation.findMany({
      where: {
        workspaceId,
        OR: [
          { id: { in: allowedChannelIds } },
          {
            type: ConversationType.DIRECT,
            members: {
              some: {
                userId: currentUserId,
              },
            },
          },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          include: {
            user: {
              select: CHAT_USER_SELECT,
            },
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: MESSAGE_SELECT,
        },
      },
      orderBy: [
        {
          lastMessageAt: {
            sort: 'desc',
            nulls: 'last',
          },
        },
        { createdAt: 'asc' },
      ],
    });

    const items = await Promise.all(
      conversations.map(async (conversation) => {
        const myMembership = conversation.members.find(
          (member) => member.userId === currentUserId,
        );

        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conversation.id,
            deletedAt: null,
            senderId: { not: currentUserId },
            ...(myMembership?.lastReadAt
              ? { createdAt: { gt: myMembership.lastReadAt } }
              : {}),
          },
        });

        const latestMessage = conversation.messages[0] ?? null;

        return {
          id: conversation.id,
          workspaceId: conversation.workspaceId,
          projectId: conversation.projectId,
          type: conversation.type,
          name:
            conversation.type === ConversationType.PROJECT
              ? (conversation.project?.name ?? conversation.name ?? 'Project')
              : conversation.name,
          lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
          createdAt: conversation.createdAt.toISOString(),
          unreadCount,
          lastMessage: latestMessage ? this.formatMessage(latestMessage) : null,
          participants: conversation.members.map((member) => ({
            userId: member.userId,
            lastReadAt: member.lastReadAt?.toISOString() ?? null,
            user: member.user,
          })),
        };
      }),
    );

    return items;
  }

  async ensureDirectConversation(
    workspaceId: string,
    currentUserId: string,
    targetUserId: string,
  ) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException(
        'Cannot create a direct conversation with yourself',
      );
    }

    await this.workspaceAccessService.assertMember(workspaceId, currentUserId);
    await this.workspaceAccessService.assertMember(workspaceId, targetUserId);

    const directKey = `${workspaceId}:${[currentUserId, targetUserId].sort().join(':')}`;

    let conversation = await this.prisma.conversation.findUnique({
      where: { directKey },
      select: { id: true },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          workspaceId,
          type: ConversationType.DIRECT,
          directKey,
          createdById: currentUserId,
          members: {
            create: [{ userId: currentUserId }, { userId: targetUserId }],
          },
        },
        select: { id: true },
      });
    } else {
      await Promise.all([
        this.ensureConversationMember(conversation.id, currentUserId),
        this.ensureConversationMember(conversation.id, targetUserId),
      ]);
    }

    const conversations = await this.listConversations(
      workspaceId,
      currentUserId,
    );

    const found = conversations.find((item) => item.id === conversation.id);
    if (!found) {
      throw new NotFoundException('Direct conversation not found');
    }

    return found;
  }

  async assertConversationAccess(
    conversationId: string,
    currentUserId: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        workspaceId: true,
        projectId: true,
        type: true,
        name: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const membership = await this.workspaceAccessService.assertMember(
      conversation.workspaceId,
      currentUserId,
    );

    if (
      conversation.type === ConversationType.PROJECT &&
      conversation.projectId
    ) {
      await this.projectAccessService.assertCanReadProject(
        conversation.workspaceId,
        conversation.projectId,
        currentUserId,
      );
    }

    if (conversation.type === ConversationType.DIRECT) {
      const member = await this.prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId: currentUserId,
          },
        },
        select: { id: true },
      });

      if (!member) {
        throw new ForbiddenException(
          'You do not have access to this direct conversation',
        );
      }
    }

    return { conversation, membership };
  }

  async listMessages(
    conversationId: string,
    currentUserId: string,
    query: QueryMessagesDto = {},
  ) {
    await this.assertConversationAccess(conversationId, currentUserId);

    const limit = query.limit ?? 50;

    let cursorCreatedAt: Date | undefined;
    if (query.cursor) {
      const cursorMsg = await this.prisma.message.findFirst({
        where: {
          id: query.cursor,
          conversationId,
        },
        select: { createdAt: true },
      });
      if (cursorMsg) {
        cursorCreatedAt = cursorMsg.createdAt;
      }
    }

    const records = await this.prisma.message.findMany({
      where: {
        conversationId,
        ...(cursorCreatedAt ? { createdAt: { lt: cursorCreatedAt } } : {}),
      },
      select: MESSAGE_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = records.length > limit;
    const sliced = hasMore ? records.slice(0, limit) : records;
    const chronological = sliced
      .reverse()
      .map((item) => this.formatMessage(item));
    const nextCursor = hasMore ? (chronological[0]?.id ?? null) : null;

    return {
      messages: chronological,
      hasMore,
      nextCursor,
    };
  }

  async sendMessage(
    conversationId: string,
    currentUserId: string,
    rawContent: string,
  ) {
    const { conversation } = await this.assertConversationAccess(
      conversationId,
      currentUserId,
    );

    const content = rawContent.trim();
    if (!content) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const now = new Date();
    const created = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: currentUserId,
          type: MessageType.TEXT,
          content,
        },
        select: MESSAGE_SELECT,
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: now },
      });

      await tx.conversationMember.upsert({
        where: {
          conversationId_userId: {
            conversationId,
            userId: currentUserId,
          },
        },
        create: {
          conversationId,
          userId: currentUserId,
          lastReadAt: now,
        },
        update: {
          lastReadAt: now,
        },
      });

      return msg;
    });

    const recipientUserIds = await this.getAuthorizedUserIds(
      conversation.workspaceId,
      conversation.id,
      conversation.type,
      conversation.projectId,
    );

    const formatted = this.formatMessage(created);

    if (this.notificationsService) {
      void this.dispatchChatNotifications(
        conversation,
        formatted,
        recipientUserIds,
      );
    }

    return {
      message: formatted,
      workspaceId: conversation.workspaceId,
      conversationId: conversation.id,
      conversationType: conversation.type,
      recipientUserIds,
    };
  }

  async editMessage(
    conversationId: string,
    messageId: string,
    currentUserId: string,
    rawContent: string,
  ) {
    const { conversation } = await this.assertConversationAccess(
      conversationId,
      currentUserId,
    );

    const existing = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId },
      select: { id: true, senderId: true, deletedAt: true },
    });

    if (!existing) {
      throw new NotFoundException('Message not found');
    }

    if (existing.senderId !== currentUserId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (existing.deletedAt) {
      throw new BadRequestException('Cannot edit a deleted message');
    }

    const content = rawContent.trim();
    if (!content) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        editedAt: new Date(),
      },
      select: MESSAGE_SELECT,
    });

    return {
      message: this.formatMessage(updated),
      workspaceId: conversation.workspaceId,
      conversationId,
    };
  }

  async deleteMessage(
    conversationId: string,
    messageId: string,
    currentUserId: string,
  ) {
    const { conversation, membership } = await this.assertConversationAccess(
      conversationId,
      currentUserId,
    );

    const existing = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId },
      select: { id: true, senderId: true, deletedAt: true },
    });

    if (!existing) {
      throw new NotFoundException('Message not found');
    }

    const canModerate =
      existing.senderId === currentUserId ||
      membership.role === WorkspaceRole.OWNER ||
      membership.role === WorkspaceRole.ADMIN;

    if (!canModerate) {
      throw new ForbiddenException(
        'You do not have permission to delete this message',
      );
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: '',
        deletedAt: new Date(),
      },
      select: MESSAGE_SELECT,
    });

    return {
      message: this.formatMessage(updated),
      workspaceId: conversation.workspaceId,
      conversationId,
    };
  }

  async markAsRead(conversationId: string, currentUserId: string) {
    await this.assertConversationAccess(conversationId, currentUserId);

    const now = new Date();
    await this.prisma.conversationMember.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId: currentUserId,
        },
      },
      create: {
        conversationId,
        userId: currentUserId,
        lastReadAt: now,
      },
      update: {
        lastReadAt: now,
      },
    });

    return {
      conversationId,
      userId: currentUserId,
      lastReadAt: now.toISOString(),
    };
  }

  private async ensureGeneralChannel(workspaceId: string, userId: string) {
    let channel = await this.prisma.conversation.findFirst({
      where: {
        workspaceId,
        type: ConversationType.WORKSPACE,
      },
      select: { id: true },
    });

    if (!channel) {
      channel = await this.prisma.conversation.create({
        data: {
          workspaceId,
          type: ConversationType.WORKSPACE,
          name: 'general',
          createdById: userId,
        },
        select: { id: true },
      });
    }

    await this.ensureConversationMember(channel.id, userId);
    return channel;
  }

  private async ensureProjectChannel(
    workspaceId: string,
    projectId: string,
    projectName: string,
    userId: string,
  ) {
    const channel = await this.prisma.conversation.upsert({
      where: { projectId },
      create: {
        workspaceId,
        projectId,
        type: ConversationType.PROJECT,
        name: projectName,
        createdById: userId,
      },
      update: {},
      select: { id: true },
    });

    await this.ensureConversationMember(channel.id, userId);
    return channel;
  }

  private async ensureConversationMember(
    conversationId: string,
    userId: string,
  ) {
    await this.prisma.conversationMember.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      create: {
        conversationId,
        userId,
      },
      update: {},
    });
  }

  private async getAuthorizedUserIds(
    workspaceId: string,
    conversationId: string,
    type: ConversationType,
    projectId: string | null,
  ): Promise<string[]> {
    if (type === ConversationType.DIRECT) {
      const members = await this.prisma.conversationMember.findMany({
        where: { conversationId },
        select: { userId: true },
      });
      return members.map((item) => item.userId);
    }

    if (type === ConversationType.PROJECT && projectId) {
      const [projectMembers, workspaceAdmins] = await Promise.all([
        this.prisma.projectMember.findMany({
          where: { projectId },
          select: { userId: true },
        }),
        this.prisma.workspaceMember.findMany({
          where: {
            workspaceId,
            role: { in: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN] },
          },
          select: { userId: true },
        }),
      ]);

      const unique = new Set<string>();
      for (const m of projectMembers) unique.add(m.userId);
      for (const m of workspaceAdmins) unique.add(m.userId);
      return [...unique];
    }

    const workspaceMembers = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: { userId: true },
    });
    return workspaceMembers.map((item) => item.userId);
  }

  private async dispatchChatNotifications(
    conversation: {
      id: string;
      workspaceId: string;
      projectId: string | null;
      type: ConversationType;
      name: string | null;
    },
    message: FormattedChatMessage,
    recipientUserIds: string[],
  ) {
    if (!this.notificationsService) {
      return;
    }

    const targets = recipientUserIds.filter((id) => id !== message.senderId);
    if (targets.length === 0) {
      return;
    }

    if (conversation.type === ConversationType.DIRECT) {
      const preview =
        message.content.length > 100
          ? `${message.content.slice(0, 100)}...`
          : message.content;

      await Promise.all(
        targets.map((userId) =>
          this.notificationsService!.createNotification({
            userId,
            type: NotificationType.CHAT_MESSAGE,
            title: `Tin nhắn mới từ ${message.sender.fullName}`,
            message: preview,
            metadata: {
              workspaceId: conversation.workspaceId,
              conversationId: conversation.id,
            },
          }),
        ),
      );
      return;
    }

    const loweredContent = message.content.toLowerCase();
    if (!loweredContent.includes('@')) {
      return;
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: targets } },
      select: { id: true, fullName: true },
    });

    const mentionedUsers = users.filter((user) =>
      loweredContent.includes(`@${user.fullName.toLowerCase()}`),
    );

    if (mentionedUsers.length === 0) {
      return;
    }

    await Promise.all(
      mentionedUsers.map((user) =>
        this.notificationsService!.createNotification({
          userId: user.id,
          type: NotificationType.MENTION,
          title: `${message.sender.fullName} đã nhắc đến bạn trong #${conversation.name ?? 'chat'}`,
          message:
            message.content.length > 100
              ? `${message.content.slice(0, 100)}...`
              : message.content,
          projectId: conversation.projectId ?? undefined,
          metadata: {
            workspaceId: conversation.workspaceId,
            conversationId: conversation.id,
            projectId: conversation.projectId,
          },
        }),
      ),
    );
  }

  private formatMessage(record: {
    id: string;
    conversationId: string;
    senderId: string;
    type: MessageType;
    content: string;
    editedAt: Date | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    sender: {
      id: string;
      email: string;
      fullName: string;
      avatarUrl: string | null;
    };
  }): FormattedChatMessage {
    return {
      id: record.id,
      conversationId: record.conversationId,
      senderId: record.senderId,
      type: record.type,
      content: record.deletedAt ? '' : record.content,
      editedAt: record.editedAt?.toISOString() ?? null,
      deletedAt: record.deletedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      sender: record.sender,
    };
  }
}
