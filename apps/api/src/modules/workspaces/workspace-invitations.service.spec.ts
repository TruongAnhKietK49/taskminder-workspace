import { WorkspaceInvitationStatus } from '../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { WorkspaceAccessService } from './workspace-access.service';
import { WorkspaceInvitationsService } from './workspace-invitations.service';

interface FindManyInvitationsArg {
  where: {
    email: string;
    status: WorkspaceInvitationStatus;
    expiresAt: { gt: Date };
  };
  select: {
    workspace: {
      select: {
        id: boolean;
        name: boolean;
        description: boolean;
      };
    };
  };
  orderBy: { createdAt: string };
}

describe('WorkspaceInvitationsService', () => {
  const mockFindUniqueOrThrow = jest.fn();
  const mockFindMany = jest.fn<Promise<unknown>, [FindManyInvitationsArg]>();

  const mockPrisma = {
    user: {
      findUniqueOrThrow: mockFindUniqueOrThrow,
    },
    workspaceInvitation: {
      findMany: mockFindMany,
    },
  };

  const mockWorkspaceAccessService = {
    assertCanManageMembers: jest.fn(),
  };

  let service: WorkspaceInvitationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkspaceInvitationsService(
      mockPrisma as unknown as PrismaService,
      mockWorkspaceAccessService as unknown as WorkspaceAccessService,
    );
  });

  describe('findMine', () => {
    it('normalizes the user email and returns pending non-expired invitations with workspace info', async () => {
      const expectedInvitations = [
        {
          id: 'inv-1',
          workspaceId: 'ws-1',
          email: 'recipient@example.com',
          role: 'MEMBER',
          token: 'tok-123',
          status: WorkspaceInvitationStatus.PENDING,
          workspace: {
            id: 'ws-1',
            name: 'TaskMinder Team',
            description: 'Core workspace',
          },
        },
      ];

      mockFindUniqueOrThrow.mockResolvedValue({
        email: '  Recipient@Example.COM ',
      });
      mockFindMany.mockResolvedValue(expectedInvitations);

      const result = await service.findMine('user-1');

      expect(mockFindUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { email: true },
      });

      expect(mockFindMany).toHaveBeenCalledTimes(1);

      const firstCall = mockFindMany.mock.calls[0];
      expect(firstCall).toBeDefined();
      const findManyArg = firstCall[0];

      expect(findManyArg.where.email).toBe('recipient@example.com');
      expect(findManyArg.where.status).toBe(WorkspaceInvitationStatus.PENDING);
      expect(findManyArg.where.expiresAt.gt).toBeInstanceOf(Date);
      expect(findManyArg.select.workspace).toEqual({
        select: {
          id: true,
          name: true,
          description: true,
        },
      });
      expect(findManyArg.orderBy).toEqual({ createdAt: 'desc' });

      expect(result).toEqual(expectedInvitations);
    });
  });
});
