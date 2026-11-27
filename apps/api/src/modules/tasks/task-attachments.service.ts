import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ALLOWED_ATTACHMENT_EXTENSIONS,
  ALLOWED_ATTACHMENT_MIME_TYPES,
  TASK_ACTIVITY_ACTIONS,
  TASK_ATTACHMENT_MAX_BYTES,
} from './constants/task.constants';
import { TaskAccessService } from './task-access.service';
import { TaskActivitiesService } from './task-activities.service';

export interface UploadedTaskFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const TASK_ATTACHMENT_SELECT = {
  id: true,
  taskId: true,
  uploadedById: true,
  originalName: true,
  mimeType: true,
  size: true,
  createdAt: true,
  uploadedBy: {
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
    },
  },
} as const;

@Injectable()
export class TaskAttachmentsService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'tasks');

  constructor(
    private readonly prisma: PrismaService,
    private readonly taskAccessService: TaskAccessService,
    private readonly taskActivitiesService: TaskActivitiesService,
  ) {}

  async findAll(
    workspaceId: string,
    projectId: string,
    taskId: string,
    currentUserId: string,
  ) {
    await this.taskAccessService.assertCanReadProjectTasks(
      workspaceId,
      projectId,
      currentUserId,
    );

    await this.taskAccessService.assertTaskExists(
      workspaceId,
      projectId,
      taskId,
    );

    return this.prisma.taskAttachment.findMany({
      where: {
        taskId,
      },
      select: TASK_ATTACHMENT_SELECT,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async upload(
    workspaceId: string,
    projectId: string,
    taskId: string,
    currentUserId: string,
    file?: UploadedTaskFile,
  ) {
    await this.taskAccessService.assertCanContributeToTask(
      workspaceId,
      projectId,
      taskId,
      currentUserId,
    );

    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size <= 0 || file.size > TASK_ATTACHMENT_MAX_BYTES) {
      throw new BadRequestException(
        'File size must be between 1 byte and 10 MB',
      );
    }

    const originalName = path
      .basename(file.originalname || 'attachment')
      .replace(/[\r\n\0]/g, '_');
    const ext = path.extname(originalName).toLowerCase();

    if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(ext)) {
      throw new BadRequestException(
        `Unsupported file extension: ${ext || 'none'}`,
      );
    }

    if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    const storageKey = `${randomUUID()}${ext}`;
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.writeFile(path.join(this.uploadDir, storageKey), file.buffer);

    const attachment = await this.prisma.taskAttachment.create({
      data: {
        taskId,
        uploadedById: currentUserId,
        originalName,
        storageKey,
        mimeType: file.mimetype,
        size: file.size,
      },
      select: TASK_ATTACHMENT_SELECT,
    });

    await this.taskActivitiesService.record({
      taskId,
      actorId: currentUserId,
      action: TASK_ACTIVITY_ACTIONS.ATTACHMENT_UPLOADED,
      newValue: {
        originalName,
        size: file.size,
        mimeType: file.mimetype,
      },
    });

    return attachment;
  }

  async getDownloadStream(
    workspaceId: string,
    projectId: string,
    taskId: string,
    attachmentId: string,
    currentUserId: string,
  ) {
    await this.taskAccessService.assertCanReadProjectTasks(
      workspaceId,
      projectId,
      currentUserId,
    );

    await this.taskAccessService.assertTaskExists(
      workspaceId,
      projectId,
      taskId,
    );

    const attachment = await this.prisma.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        taskId,
      },
      select: {
        id: true,
        originalName: true,
        storageKey: true,
        mimeType: true,
        size: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const filePath = path.join(this.uploadDir, attachment.storageKey);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Attachment file not found on storage');
    }

    return {
      stream: createReadStream(filePath),
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
    };
  }

  async remove(
    workspaceId: string,
    projectId: string,
    taskId: string,
    attachmentId: string,
    currentUserId: string,
  ) {
    await this.taskAccessService.assertCanReadProjectTasks(
      workspaceId,
      projectId,
      currentUserId,
    );

    await this.taskAccessService.assertTaskExists(
      workspaceId,
      projectId,
      taskId,
    );

    const attachment = await this.prisma.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        taskId,
      },
      select: {
        id: true,
        uploadedById: true,
        originalName: true,
        storageKey: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (attachment.uploadedById !== currentUserId) {
      const isManager = await this.taskAccessService.isWorkspaceManager(
        workspaceId,
        currentUserId,
      );

      if (!isManager) {
        throw new ForbiddenException(
          'You can only delete your own attachments',
        );
      }
    }

    await this.prisma.taskAttachment.delete({
      where: {
        id: attachment.id,
      },
    });

    try {
      await fs.unlink(path.join(this.uploadDir, attachment.storageKey));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    await this.taskActivitiesService.record({
      taskId,
      actorId: currentUserId,
      action: TASK_ACTIVITY_ACTIONS.ATTACHMENT_DELETED,
      oldValue: {
        originalName: attachment.originalName,
      },
    });
  }
}
