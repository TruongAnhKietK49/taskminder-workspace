import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskAccessService } from './task-access.service';
import { TaskActivitiesService } from './task-activities.service';
import { TaskAttachmentsService } from './task-attachments.service';

describe('TaskAttachmentsService', () => {
  const workspaceId = '11111111-1111-1111-1111-111111111111';
  const projectId = '22222222-2222-2222-2222-222222222222';
  const taskId = '33333333-3333-3333-3333-333333333333';
  const attachmentId = '44444444-4444-4444-4444-444444444444';
  const userId = '55555555-5555-5555-5555-555555555555';
  const otherUserId = '66666666-6666-6666-6666-666666666666';

  let service: TaskAttachmentsService;
  let findFirstMock: jest.Mock;
  let isWorkspaceManagerMock: jest.Mock;

  beforeEach(() => {
    findFirstMock = jest.fn();
    isWorkspaceManagerMock = jest.fn().mockResolvedValue(false);

    const prismaMock = {
      taskAttachment: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: findFirstMock,
        create: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as PrismaService;

    const taskAccessMock = {
      assertCanReadProjectTasks: jest.fn().mockResolvedValue(undefined),
      assertTaskExists: jest.fn().mockResolvedValue(undefined),
      assertCanContributeToTask: jest.fn().mockResolvedValue(undefined),
      isWorkspaceManager: isWorkspaceManagerMock,
    } as unknown as TaskAccessService;

    const taskActivitiesMock = {
      record: jest.fn().mockResolvedValue(undefined),
    } as unknown as TaskActivitiesService;

    service = new TaskAttachmentsService(
      prismaMock,
      taskAccessMock,
      taskActivitiesMock,
    );
  });

  it('rejects missing file', async () => {
    await expect(
      service.upload(workspaceId, projectId, taskId, userId, undefined),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects oversized file (> 10 MB)', async () => {
    await expect(
      service.upload(workspaceId, projectId, taskId, userId, {
        originalname: 'big.pdf',
        mimetype: 'application/pdf',
        size: 11 * 1024 * 1024,
        buffer: Buffer.from('a'),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects unsupported file extension or mime type', async () => {
    await expect(
      service.upload(workspaceId, projectId, taskId, userId, {
        originalname: 'script.exe',
        mimetype: 'application/x-msdownload',
        size: 100,
        buffer: Buffer.from('a'),
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.upload(workspaceId, projectId, taskId, userId, {
        originalname: 'fake.png',
        mimetype: 'application/x-msdownload',
        size: 100,
        buffer: Buffer.from('a'),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects deleting another user attachment when not manager', async () => {
    findFirstMock.mockResolvedValue({
      id: attachmentId,
      uploadedById: otherUserId,
      originalName: 'spec.pdf',
      storageKey: 'uuid.pdf',
    });
    isWorkspaceManagerMock.mockResolvedValue(false);

    await expect(
      service.remove(workspaceId, projectId, taskId, attachmentId, userId),
    ).rejects.toThrow(ForbiddenException);
  });
});
