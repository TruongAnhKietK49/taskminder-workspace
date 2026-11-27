import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TASK_ACTIVITY_ACTIONS } from './constants/task.constants';
import { TaskAccessService } from './task-access.service';
import { TaskActivitiesService } from './task-activities.service';
import { TaskCommentsService } from './task-comments.service';

describe('TaskCommentsService', () => {
  const workspaceId = '11111111-1111-1111-1111-111111111111';
  const projectId = '22222222-2222-2222-2222-222222222222';
  const taskId = '33333333-3333-3333-3333-333333333333';
  const commentId = '44444444-4444-4444-4444-444444444444';
  const userId = '55555555-5555-5555-5555-555555555555';
  const otherUserId = '66666666-6666-6666-6666-666666666666';

  let service: TaskCommentsService;
  let createMock: jest.Mock;
  let findFirstMock: jest.Mock;
  let updateMock: jest.Mock;
  let deleteMock: jest.Mock;
  let recordMock: jest.Mock;
  let isWorkspaceManagerMock: jest.Mock;

  beforeEach(() => {
    createMock = jest.fn();
    findFirstMock = jest.fn();
    updateMock = jest.fn();
    deleteMock = jest.fn();
    recordMock = jest.fn().mockResolvedValue(undefined);
    isWorkspaceManagerMock = jest.fn().mockResolvedValue(false);

    const prismaMock = {
      taskComment: {
        findMany: jest.fn().mockResolvedValue([]),
        create: createMock,
        findFirst: findFirstMock,
        update: updateMock,
        delete: deleteMock,
      },
    } as unknown as PrismaService;

    const taskAccessMock = {
      assertCanReadProjectTasks: jest.fn().mockResolvedValue(undefined),
      assertTaskExists: jest.fn().mockResolvedValue(undefined),
      assertCanContributeToTask: jest.fn().mockResolvedValue(undefined),
      isWorkspaceManager: isWorkspaceManagerMock,
    } as unknown as TaskAccessService;

    const taskActivitiesMock = {
      record: recordMock,
    } as unknown as TaskActivitiesService;

    service = new TaskCommentsService(
      prismaMock,
      taskAccessMock,
      taskActivitiesMock,
    );
  });

  it('creates a trimmed comment and records COMMENT_ADDED activity', async () => {
    createMock.mockResolvedValue({
      id: commentId,
      taskId,
      authorId: userId,
      content: 'Looks good!',
    });

    const result = await service.create(
      workspaceId,
      projectId,
      taskId,
      userId,
      {
        content: '  Looks good!  ',
      },
    );

    expect(result.id).toBe(commentId);
    expect(recordMock).toHaveBeenCalledWith({
      taskId,
      actorId: userId,
      action: TASK_ACTIVITY_ACTIONS.COMMENT_ADDED,
      newValue: {
        commentId,
        preview: 'Looks good!',
      },
    });
  });

  it('rejects whitespace-only comment content', async () => {
    await expect(
      service.create(workspaceId, projectId, taskId, userId, {
        content: '   ',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows author to edit own comment and rejects other users', async () => {
    findFirstMock.mockResolvedValueOnce({
      id: commentId,
      authorId: userId,
    });
    updateMock.mockResolvedValue({
      id: commentId,
      content: 'Updated',
    });

    const updated = await service.update(
      workspaceId,
      projectId,
      taskId,
      commentId,
      userId,
      { content: 'Updated' },
    );
    expect(updated.content).toBe('Updated');

    findFirstMock.mockResolvedValueOnce({
      id: commentId,
      authorId: otherUserId,
    });

    await expect(
      service.update(workspaceId, projectId, taskId, commentId, userId, {
        content: 'Hijack',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows manager to delete another user comment, rejects non-manager', async () => {
    findFirstMock.mockResolvedValueOnce({
      id: commentId,
      authorId: otherUserId,
    });
    isWorkspaceManagerMock.mockResolvedValueOnce(false);

    await expect(
      service.remove(workspaceId, projectId, taskId, commentId, userId),
    ).rejects.toThrow(ForbiddenException);

    findFirstMock.mockResolvedValueOnce({
      id: commentId,
      authorId: otherUserId,
    });
    isWorkspaceManagerMock.mockResolvedValueOnce(true);

    await service.remove(workspaceId, projectId, taskId, commentId, userId);
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: commentId } });
  });

  it('throws NotFoundException when deleting missing comment', async () => {
    findFirstMock.mockResolvedValue(null);

    await expect(
      service.remove(workspaceId, projectId, taskId, commentId, userId),
    ).rejects.toThrow(NotFoundException);
  });
});
