import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Permission } from '../../common/permissions/permission.enum';
import { WorkspaceRole } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service';
import { TaskAccessService } from './task-access.service';

describe('TaskAccessService', () => {
  const workspaceId = '11111111-1111-1111-1111-111111111111';
  const projectId = '22222222-2222-2222-2222-222222222222';
  const taskId = '33333333-3333-3333-3333-333333333333';
  const userId = '44444444-4444-4444-4444-444444444444';
  const otherUserId = '55555555-5555-5555-5555-555555555555';

  let service: TaskAccessService;
  let findFirstMock: jest.Mock;
  let findUniqueMock: jest.Mock;
  let assertPermissionMock: jest.Mock;
  let assertCanReadProjectMock: jest.Mock;
  let getVisibleProjectsWhereMock: jest.Mock;

  beforeEach(() => {
    findFirstMock = jest.fn();
    findUniqueMock = jest.fn();
    assertPermissionMock = jest.fn();
    assertCanReadProjectMock = jest.fn().mockResolvedValue(undefined);
    getVisibleProjectsWhereMock = jest.fn();

    const prismaMock = {
      task: {
        findFirst: findFirstMock,
      },
      projectMember: {
        findUnique: findUniqueMock,
      },
    } as unknown as PrismaService;

    const workspaceAccessMock = {
      assertPermission: assertPermissionMock,
    } as unknown as WorkspaceAccessService;

    const projectAccessMock = {
      assertCanReadProject: assertCanReadProjectMock,
      getVisibleProjectsWhere: getVisibleProjectsWhereMock,
    } as unknown as ProjectAccessService;

    service = new TaskAccessService(
      prismaMock,
      workspaceAccessMock,
      projectAccessMock,
    );
  });

  it('assertCanReadProjectTasks delegates to ProjectAccessService', async () => {
    await service.assertCanReadProjectTasks(workspaceId, projectId, userId);
    expect(assertCanReadProjectMock).toHaveBeenCalledWith(
      workspaceId,
      projectId,
      userId,
    );
  });

  it('assertCanCreateTask verifies project read access and TASK_CREATE permission', async () => {
    assertPermissionMock.mockResolvedValue({ role: WorkspaceRole.MEMBER });

    await service.assertCanCreateTask(workspaceId, projectId, userId);

    expect(assertCanReadProjectMock).toHaveBeenCalledWith(
      workspaceId,
      projectId,
      userId,
    );
    expect(assertPermissionMock).toHaveBeenCalledWith(
      workspaceId,
      userId,
      Permission.TASK_CREATE,
    );
  });

  describe('assertCanUpdateTask', () => {
    it('allows OWNER and ADMIN to update any task', async () => {
      const targetTask = {
        id: taskId,
        createdById: otherUserId,
        assigneeId: null,
      };
      assertPermissionMock.mockResolvedValue({ role: WorkspaceRole.ADMIN });
      findFirstMock.mockResolvedValue(targetTask);

      const result = await service.assertCanUpdateTask(
        workspaceId,
        projectId,
        taskId,
        userId,
      );

      expect(result).toEqual(targetTask);
    });

    it('allows MEMBER to update task they created or are assigned to', async () => {
      assertPermissionMock.mockResolvedValue({ role: WorkspaceRole.MEMBER });
      findFirstMock.mockResolvedValueOnce({
        id: taskId,
        createdById: userId,
        assigneeId: null,
      });

      await expect(
        service.assertCanUpdateTask(workspaceId, projectId, taskId, userId),
      ).resolves.toMatchObject({ id: taskId });

      findFirstMock.mockResolvedValueOnce({
        id: taskId,
        createdById: otherUserId,
        assigneeId: userId,
      });

      await expect(
        service.assertCanUpdateTask(workspaceId, projectId, taskId, userId),
      ).resolves.toMatchObject({ id: taskId });
    });

    it('rejects MEMBER updating an unrelated task with ForbiddenException', async () => {
      assertPermissionMock.mockResolvedValue({ role: WorkspaceRole.MEMBER });
      findFirstMock.mockResolvedValue({
        id: taskId,
        createdById: otherUserId,
        assigneeId: otherUserId,
      });

      await expect(
        service.assertCanUpdateTask(workspaceId, projectId, taskId, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when task does not exist', async () => {
      assertPermissionMock.mockResolvedValue({ role: WorkspaceRole.OWNER });
      findFirstMock.mockResolvedValue(null);

      await expect(
        service.assertCanUpdateTask(workspaceId, projectId, taskId, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assertCanAssignTask', () => {
    it('skips permission check when assignee is unchanged', async () => {
      await service.assertCanAssignTask(
        workspaceId,
        userId,
        otherUserId,
        otherUserId,
      );
      await service.assertCanAssignTask(workspaceId, userId, undefined, null);

      expect(assertPermissionMock).not.toHaveBeenCalled();
    });

    it('allows MEMBER to self-assign an unassigned task or self-unassign own task', async () => {
      await service.assertCanAssignTask(workspaceId, userId, userId, null);
      await service.assertCanAssignTask(workspaceId, userId, null, userId);

      expect(assertPermissionMock).not.toHaveBeenCalled();
    });

    it('requires TASK_ASSIGN permission when assigning to another user', async () => {
      assertPermissionMock.mockRejectedValue(new ForbiddenException());

      await expect(
        service.assertCanAssignTask(workspaceId, userId, otherUserId, null),
      ).rejects.toThrow(ForbiddenException);

      expect(assertPermissionMock).toHaveBeenCalledWith(
        workspaceId,
        userId,
        Permission.TASK_ASSIGN,
      );
    });

    it('requires TASK_ASSIGN permission when reassigning or unassigning another user task', async () => {
      assertPermissionMock.mockResolvedValue({ role: WorkspaceRole.OWNER });

      await service.assertCanAssignTask(workspaceId, userId, null, otherUserId);

      expect(assertPermissionMock).toHaveBeenCalledWith(
        workspaceId,
        userId,
        Permission.TASK_ASSIGN,
      );
    });
  });

  describe('assertAssigneeIsProjectMember', () => {
    it('skips check when assigneeId is null or undefined', async () => {
      await service.assertAssigneeIsProjectMember(projectId, null);
      await service.assertAssigneeIsProjectMember(projectId, undefined);
      expect(findUniqueMock).not.toHaveBeenCalled();
    });

    it('passes when assignee is a project member', async () => {
      findUniqueMock.mockResolvedValue({ id: 'member-1' });
      await expect(
        service.assertAssigneeIsProjectMember(projectId, otherUserId),
      ).resolves.toBeUndefined();
    });

    it('throws ForbiddenException when assignee is not a project member', async () => {
      findUniqueMock.mockResolvedValue(null);
      await expect(
        service.assertAssigneeIsProjectMember(projectId, otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
