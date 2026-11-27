import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  ConversationType,
  MessageType,
  WorkspaceRole,
} from '../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ProjectAccessService } from '../projects/project-access.service';
import type { WorkspaceAccessService } from '../workspaces/workspace-access.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  const mockConversationFindUnique = jest.fn();
  const mockConversationMemberFindUnique = jest.fn();
  const mockMessageFindFirst = jest.fn();
  const mockMessageUpdate = jest.fn();

  const mockPrisma = {
    conversation: {
      findUnique: mockConversationFindUnique,
    },
    conversationMember: {
      findUnique: mockConversationMemberFindUnique,
    },
    message: {
      findFirst: mockMessageFindFirst,
      update: mockMessageUpdate,
    },
  };

  const mockWorkspaceAccessService = {
    assertMember: jest.fn(),
  };

  const mockProjectAccessService = {
    assertCanReadProject: jest.fn(),
    getVisibleProjectsWhere: jest.fn(),
  };

  let service: ChatService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChatService(
      mockPrisma as unknown as PrismaService,
      mockWorkspaceAccessService as unknown as WorkspaceAccessService,
      mockProjectAccessService as unknown as ProjectAccessService,
    );
  });

  it('rejects creating a direct conversation with yourself', async () => {
    await expect(
      service.ensureDirectConversation('ws-1', 'user-1', 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('forbids editing another user message', async () => {
    mockConversationFindUnique.mockResolvedValue({
      id: 'conv-1',
      workspaceId: 'ws-1',
      projectId: null,
      type: ConversationType.WORKSPACE,
      name: 'general',
    });
    mockWorkspaceAccessService.assertMember.mockResolvedValue({
      id: 'wm-1',
      workspaceId: 'ws-1',
      userId: 'user-2',
      role: WorkspaceRole.MEMBER,
    });
    mockMessageFindFirst.mockResolvedValue({
      id: 'msg-1',
      senderId: 'user-1',
      deletedAt: null,
    });

    await expect(
      service.editMessage('conv-1', 'msg-1', 'user-2', 'Hacked'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows workspace ADMIN to soft-delete another member message', async () => {
    const now = new Date('2026-11-27T06:00:00.000Z');
    mockConversationFindUnique.mockResolvedValue({
      id: 'conv-1',
      workspaceId: 'ws-1',
      projectId: null,
      type: ConversationType.WORKSPACE,
      name: 'general',
    });
    mockWorkspaceAccessService.assertMember.mockResolvedValue({
      id: 'wm-admin',
      workspaceId: 'ws-1',
      userId: 'admin-1',
      role: WorkspaceRole.ADMIN,
    });
    mockMessageFindFirst.mockResolvedValue({
      id: 'msg-1',
      senderId: 'user-1',
      deletedAt: null,
    });
    mockMessageUpdate.mockResolvedValue({
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-1',
      type: MessageType.TEXT,
      content: '',
      editedAt: null,
      deletedAt: now,
      createdAt: now,
      updatedAt: now,
      sender: {
        id: 'user-1',
        email: 'u1@example.com',
        fullName: 'User One',
        avatarUrl: null,
      },
    });

    const result = await service.deleteMessage('conv-1', 'msg-1', 'admin-1');
    expect(result.message.deletedAt).toBe(now.toISOString());
    expect(result.message.content).toBe('');
  });
});
