import type { PrismaService } from '../../prisma/prisma.service';
import type { WorkspaceAccessService } from '../workspaces/workspace-access.service';
import { ActivityLogsService } from './activity-logs.service';

describe('ActivityLogsService', () => {
  const mockCreate = jest.fn();
  const mockFindMany = jest.fn();

  const mockPrisma = {
    activityLog: {
      create: mockCreate,
      findMany: mockFindMany,
    },
  };

  const mockWorkspaceAccessService = {
    assertMember: jest.fn(),
  };

  let service: ActivityLogsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ActivityLogsService(
      mockPrisma as unknown as PrismaService,
      mockWorkspaceAccessService as unknown as WorkspaceAccessService,
    );
  });

  it('records an activity log without throwing if database fails', async () => {
    mockCreate.mockRejectedValue(new Error('DB temporarily unavailable'));

    await expect(
      service.record({
        workspaceId: 'ws-1',
        actorId: 'user-1',
        entityType: 'TASK',
        entityId: 'task-1',
        action: 'TASK_CREATED',
        summary: 'Created task',
      }),
    ).resolves.toBeUndefined();

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('lists workspace activity logs after verifying membership', async () => {
    const now = new Date('2026-11-27T06:00:00.000Z');
    mockWorkspaceAccessService.assertMember.mockResolvedValue({ id: 'wm-1' });
    mockFindMany.mockResolvedValue([
      {
        id: 'log-1',
        workspaceId: 'ws-1',
        actorId: 'user-1',
        entityType: 'PROJECT',
        entityId: 'proj-1',
        action: 'PROJECT_CREATED',
        summary: 'Tạo dự án "Alpha"',
        metadata: null,
        createdAt: now,
        actor: {
          id: 'user-1',
          fullName: 'Alice',
          email: 'alice@example.com',
          avatarUrl: null,
        },
      },
    ]);

    const result = await service.findByWorkspace('ws-1', 'user-1', {
      entityType: 'PROJECT',
      limit: 10,
    });

    expect(mockWorkspaceAccessService.assertMember).toHaveBeenCalledWith(
      'ws-1',
      'user-1',
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.createdAt).toBe(now.toISOString());
  });
});
