import {
  TaskPriority,
  TaskStatus,
  WorkspaceRole,
} from '../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ProjectAccessService } from '../projects/project-access.service';
import type { WorkspaceAccessService } from '../workspaces/workspace-access.service';
import { SearchService } from './search.service';

describe('SearchService', () => {
  const mockProjectFindMany = jest.fn();
  const mockTaskFindMany = jest.fn();
  const mockCommentFindMany = jest.fn();
  const mockMessageFindMany = jest.fn();
  const mockMemberFindMany = jest.fn();

  const mockPrisma = {
    project: { findMany: mockProjectFindMany },
    task: { findMany: mockTaskFindMany },
    taskComment: { findMany: mockCommentFindMany },
    message: { findMany: mockMessageFindMany },
    workspaceMember: { findMany: mockMemberFindMany },
  };

  const mockWorkspaceAccessService = {
    assertMember: jest.fn(),
  };

  const mockProjectAccessService = {
    getVisibleProjectsWhere: jest.fn(),
  };

  let service: SearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWorkspaceAccessService.assertMember.mockResolvedValue({ id: 'wm-1' });
    mockProjectAccessService.getVisibleProjectsWhere.mockResolvedValue({
      workspaceId: 'ws-1',
    });
    service = new SearchService(
      mockPrisma as unknown as PrismaService,
      mockWorkspaceAccessService as unknown as WorkspaceAccessService,
      mockProjectAccessService as unknown as ProjectAccessService,
    );
  });

  it('returns empty buckets when query is shorter than 2 characters', async () => {
    const result = await service.searchWorkspace('ws-1', 'u1', 'a');

    expect(result.totalCount).toBe(0);
    expect(mockProjectFindMany).not.toHaveBeenCalled();
  });

  it('returns grouped search results across projects, tasks, comments, messages, and members', async () => {
    const now = new Date('2026-11-27T06:00:00.000Z');
    mockProjectFindMany.mockResolvedValue([
      { id: 'p1', name: 'Sprint', status: 'ACTIVE', description: null },
    ]);
    mockTaskFindMany.mockResolvedValue([
      {
        id: 't1',
        title: 'Sprint Task',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        projectId: 'p1',
        project: { name: 'Sprint' },
      },
    ]);
    mockCommentFindMany.mockResolvedValue([]);
    mockMessageFindMany.mockResolvedValue([]);
    mockMemberFindMany.mockResolvedValue([
      {
        id: 'wm-1',
        role: WorkspaceRole.OWNER,
        user: {
          id: 'u1',
          fullName: 'Sprint Lead',
          email: 'lead@example.com',
          avatarUrl: null,
        },
      },
    ]);

    const result = await service.searchWorkspace('ws-1', 'u1', 'Sprint');

    expect(result.totalCount).toBe(3);
    expect(result.projects).toHaveLength(1);
    expect(result.tasks).toHaveLength(1);
    expect(result.members).toHaveLength(1);
    expect(now.toISOString()).toBeTruthy();
  });
});
