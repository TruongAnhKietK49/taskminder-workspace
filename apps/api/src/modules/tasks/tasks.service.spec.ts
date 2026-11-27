import { TaskPriority, TaskStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskAccessService } from './task-access.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  const workspaceId = '11111111-1111-1111-1111-111111111111';
  const projectId = '22222222-2222-2222-2222-222222222222';
  const taskId = '33333333-3333-3333-3333-333333333333';
  const userId = '44444444-4444-4444-4444-444444444444';
  const otherUserId = '55555555-5555-5555-5555-555555555555';

  const baseTask = {
    id: taskId,
    title: 'Sample Task',
    description: 'Task description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    projectId,
    createdById: userId,
    assigneeId: null,
    dueDate: null,
    createdAt: new Date('2026-11-20T00:00:00.000Z'),
    updatedAt: new Date('2026-11-20T00:00:00.000Z'),
    createdBy: {
      id: userId,
      email: 'user@example.com',
      fullName: 'Test User',
      avatarUrl: null,
    },
    assignee: null,
  };

  let service: TasksService;
  let createMock: jest.Mock;
  let findManyMock: jest.Mock;
  let findFirstMock: jest.Mock;
  let updateMock: jest.Mock;

  let assertCanReadProjectTasksMock: jest.Mock;
  let assertCanCreateTaskMock: jest.Mock;
  let assertCanUpdateTaskMock: jest.Mock;
  let assertCanDeleteTaskMock: jest.Mock;
  let assertCanAssignTaskMock: jest.Mock;
  let assertAssigneeIsProjectMemberMock: jest.Mock;
  let getVisibleProjectsWhereMock: jest.Mock;

  beforeEach(() => {
    createMock = jest.fn();
    findManyMock = jest.fn();
    findFirstMock = jest.fn();
    updateMock = jest.fn();

    assertCanReadProjectTasksMock = jest.fn().mockResolvedValue(undefined);
    assertCanCreateTaskMock = jest.fn().mockResolvedValue(undefined);
    assertCanUpdateTaskMock = jest.fn().mockResolvedValue({
      id: taskId,
      createdById: userId,
      assigneeId: otherUserId,
    });
    assertCanDeleteTaskMock = jest.fn().mockResolvedValue(undefined);
    assertCanAssignTaskMock = jest.fn().mockResolvedValue(undefined);
    assertAssigneeIsProjectMemberMock = jest.fn().mockResolvedValue(undefined);
    getVisibleProjectsWhereMock = jest.fn().mockResolvedValue({ workspaceId });

    const prismaMock = {
      task: {
        create: createMock,
        findMany: findManyMock,
        findFirst: findFirstMock,
        update: updateMock,
      },
    } as unknown as PrismaService;

    const taskAccessMock = {
      assertCanReadProjectTasks: assertCanReadProjectTasksMock,
      assertCanCreateTask: assertCanCreateTaskMock,
      assertCanUpdateTask: assertCanUpdateTaskMock,
      assertCanDeleteTask: assertCanDeleteTaskMock,
      assertCanAssignTask: assertCanAssignTaskMock,
      assertAssigneeIsProjectMember: assertAssigneeIsProjectMemberMock,
      getVisibleProjectsWhere: getVisibleProjectsWhereMock,
    } as unknown as TaskAccessService;

    service = new TasksService(prismaMock, taskAccessMock);
  });

  it('create trims text, checks assign RBAC, and creates task with defaults', async () => {
    createMock.mockResolvedValue(baseTask);

    const result = await service.create(workspaceId, projectId, userId, {
      title: '  Sample Task  ',
      description: '  ',
      assigneeId: otherUserId,
    });

    expect(assertCanCreateTaskMock).toHaveBeenCalledWith(
      workspaceId,
      projectId,
      userId,
    );
    expect(assertCanAssignTaskMock).toHaveBeenCalledWith(
      workspaceId,
      userId,
      otherUserId,
    );
    expect(assertAssigneeIsProjectMemberMock).toHaveBeenCalledWith(
      projectId,
      otherUserId,
    );
    const [firstCall] = createMock.mock.calls as Array<
      [{ data: Record<string, unknown> }]
    >;
    expect(firstCall[0].data).toMatchObject({
      title: 'Sample Task',
      description: null,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeId: otherUserId,
    });
    expect(result.id).toBe(taskId);
  });

  describe('findAll', () => {
    it('excludes ARCHIVED tasks and uses default sorting when query is empty', async () => {
      findManyMock.mockResolvedValue([baseTask]);

      await service.findAll(workspaceId, projectId, userId);

      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId,
            project: { workspaceId },
            status: { not: TaskStatus.ARCHIVED },
          },
          orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
        }),
      );
    });

    it('applies status, priority, assigneeId, search, and custom sort', async () => {
      findManyMock.mockResolvedValue([]);

      await service.findAll(workspaceId, projectId, userId, {
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        assigneeId: otherUserId,
        search: '  auth  ',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId,
            project: { workspaceId },
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.HIGH,
            assigneeId: otherUserId,
            OR: [
              { title: { contains: 'auth', mode: 'insensitive' } },
              { description: { contains: 'auth', mode: 'insensitive' } },
            ],
          },
          orderBy: [{ createdAt: 'desc' }, { updatedAt: 'desc' }],
        }),
      );
    });

    it('supports unassigned and includeArchived flags', async () => {
      findManyMock.mockResolvedValue([]);

      await service.findAll(workspaceId, projectId, userId, {
        unassigned: true,
        includeArchived: true,
      });

      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId,
            project: { workspaceId },
            assigneeId: null,
          },
        }),
      );
    });
  });

  it('update clears nullable fields cleanly and checks assign RBAC with existing assignee', async () => {
    updateMock.mockResolvedValue({
      ...baseTask,
      description: null,
      assigneeId: null,
      dueDate: null,
    });

    await service.update(workspaceId, projectId, taskId, userId, {
      description: null,
      assigneeId: null,
      dueDate: null,
    });

    expect(assertCanAssignTaskMock).toHaveBeenCalledWith(
      workspaceId,
      userId,
      null,
      otherUserId,
    );
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: taskId },
        data: {
          description: null,
          assigneeId: null,
          dueDate: null,
        },
      }),
    );
  });

  it('archive sets task status to ARCHIVED', async () => {
    updateMock.mockResolvedValue({
      ...baseTask,
      status: TaskStatus.ARCHIVED,
    });

    const result = await service.archive(
      workspaceId,
      projectId,
      taskId,
      userId,
    );

    expect(assertCanDeleteTaskMock).toHaveBeenCalledWith(
      workspaceId,
      projectId,
      taskId,
      userId,
    );
    expect(result.status).toBe(TaskStatus.ARCHIVED);
  });

  it('findWorkspaceTasks scopes by visible projects and returns project metadata', async () => {
    const visibleWhere = {
      workspaceId,
      members: { some: { userId } },
    };
    getVisibleProjectsWhereMock.mockResolvedValue(visibleWhere);
    findManyMock.mockResolvedValue([
      {
        ...baseTask,
        project: {
          id: projectId,
          name: 'Core Platform',
          status: 'ACTIVE',
        },
      },
    ]);

    const result = await service.findWorkspaceTasks(workspaceId, userId, {
      projectId,
      assignedToMe: true,
    });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          project: visibleWhere,
          projectId,
          assigneeId: userId,
          status: { not: TaskStatus.ARCHIVED },
        },
      }),
    );
    expect(result[0].project).toEqual({
      id: projectId,
      name: 'Core Platform',
      status: 'ACTIVE',
    });
  });

  it('getWorkspaceTaskSummary aggregates counts and excludes DONE from overdue/dueSoon/assignedToMe', async () => {
    const now = Date.now();
    const pastDate = new Date(now - 2 * 24 * 60 * 60 * 1000);
    const soonDate = new Date(now + 2 * 24 * 60 * 60 * 1000);
    const laterDate = new Date(now + 20 * 24 * 60 * 60 * 1000);

    findManyMock.mockResolvedValue([
      {
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: pastDate,
        assigneeId: userId,
      },
      {
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        dueDate: soonDate,
        assigneeId: userId,
      },
      {
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        dueDate: pastDate,
        assigneeId: userId,
      },
      {
        status: TaskStatus.REVIEW,
        priority: TaskPriority.MEDIUM,
        dueDate: laterDate,
        assigneeId: otherUserId,
      },
    ]);

    const summary = await service.getWorkspaceTaskSummary(workspaceId, userId);

    expect(summary).toEqual({
      totalActive: 4,
      byStatus: {
        TODO: 1,
        IN_PROGRESS: 1,
        REVIEW: 1,
        DONE: 1,
        BLOCKED: 0,
      },
      byPriority: {
        LOW: 1,
        MEDIUM: 1,
        HIGH: 1,
        URGENT: 1,
      },
      assignedToMe: 2,
      overdue: 1,
      dueSoon: 1,
    });
  });
});
