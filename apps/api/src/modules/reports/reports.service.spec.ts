import {
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  WorkspaceRole,
} from '../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ProjectAccessService } from '../projects/project-access.service';
import type { WorkspaceAccessService } from '../workspaces/workspace-access.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const mockProjectFindMany = jest.fn();
  const mockTaskFindMany = jest.fn();
  const mockMemberFindMany = jest.fn();
  const mockWorkspaceFindUnique = jest.fn();

  const mockPrisma = {
    project: { findMany: mockProjectFindMany },
    task: { findMany: mockTaskFindMany },
    workspaceMember: { findMany: mockMemberFindMany },
    workspace: { findUnique: mockWorkspaceFindUnique },
  };

  const mockWorkspaceAccessService = {
    assertMember: jest.fn(),
  };

  const mockProjectAccessService = {
    getVisibleProjectsWhere: jest.fn(),
  };

  let service: ReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWorkspaceAccessService.assertMember.mockResolvedValue({ id: 'wm-1' });
    mockProjectAccessService.getVisibleProjectsWhere.mockResolvedValue({
      workspaceId: 'ws-1',
    });
    service = new ReportsService(
      mockPrisma as unknown as PrismaService,
      mockWorkspaceAccessService as unknown as WorkspaceAccessService,
      mockProjectAccessService as unknown as ProjectAccessService,
    );
  });

  it('computes workspace KPIs, project progress, and member workload', async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const now = new Date();

    mockProjectFindMany.mockResolvedValue([
      {
        id: 'proj-1',
        name: 'Core App',
        status: ProjectStatus.ACTIVE,
        _count: { members: 2 },
      },
    ]);

    mockTaskFindMany.mockResolvedValue([
      {
        id: 't1',
        title: 'Done Task',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        projectId: 'proj-1',
        assigneeId: 'u1',
        dueDate: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 't2',
        title: 'Overdue Task',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        projectId: 'proj-1',
        assigneeId: 'u1',
        dueDate: pastDate,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    mockMemberFindMany.mockResolvedValue([
      {
        role: WorkspaceRole.OWNER,
        user: {
          id: 'u1',
          fullName: 'Kiet',
          email: 'kiet@example.com',
          avatarUrl: null,
        },
      },
    ]);

    const overview = await service.getWorkspaceOverview('ws-1', 'u1');

    expect(overview.kpis.totalTasks).toBe(2);
    expect(overview.kpis.completedTasks).toBe(1);
    expect(overview.kpis.overdueTasks).toBe(1);
    expect(overview.kpis.completionRate).toBe(50);
    expect(overview.projectProgress[0]?.progressPercent).toBe(50);
    expect(overview.memberWorkload[0]?.overdue).toBe(1);
    expect(overview.weeklyActivity).toHaveLength(7);
  });

  it('exports CSV with UTF-8 BOM and neutralizes formula injection cells', async () => {
    const now = new Date('2026-11-27T06:00:00.000Z');
    mockWorkspaceFindUnique.mockResolvedValue({ name: 'TaskMinder Team' });
    mockTaskFindMany.mockResolvedValue([
      {
        id: 't1',
        title: '=HYPERLINK("http://evil.com")',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: null,
        createdAt: now,
        updatedAt: now,
        project: { name: 'Alpha, "Core"' },
        assignee: null,
        createdBy: { fullName: 'Kiet' },
      },
    ]);

    const csv = await service.exportTasksCsv('ws-1', 'u1');

    expect(csv.filename).toBe('taskminder-report-taskminder-team.csv');
    expect(csv.content.startsWith('\uFEFF')).toBe(true);
    expect(csv.content).toContain('"\'=HYPERLINK(""http://evil.com"")"');
    expect(csv.content).toContain('"Alpha, ""Core"""');
  });
});
