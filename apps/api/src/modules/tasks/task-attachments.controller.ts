import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { TASK_ATTACHMENT_MAX_BYTES } from './constants/task.constants';
import {
  TaskAttachmentsService,
  type UploadedTaskFile,
} from './task-attachments.service';

@Controller(
  'workspaces/:workspaceId/projects/:projectId/tasks/:taskId/attachments',
)
@UseGuards(JwtAuthGuard)
export class TaskAttachmentsController {
  constructor(
    private readonly taskAttachmentsService: TaskAttachmentsService,
  ) {}

  @Get()
  async findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const attachments = await this.taskAttachmentsService.findAll(
      workspaceId,
      projectId,
      taskId,
      user.id,
    );

    return {
      success: true,
      message: 'Task attachments retrieved successfully',
      data: {
        attachments,
      },
    };
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: TASK_ATTACHMENT_MAX_BYTES,
      },
    }),
  )
  async upload(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: UploadedTaskFile,
  ) {
    const attachment = await this.taskAttachmentsService.upload(
      workspaceId,
      projectId,
      taskId,
      user.id,
      file,
    );

    return {
      success: true,
      message: 'Attachment uploaded successfully',
      data: {
        attachment,
      },
    };
  }

  @Get(':attachmentId/download')
  async download(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { stream, originalName, mimeType } =
      await this.taskAttachmentsService.getDownloadStream(
        workspaceId,
        projectId,
        taskId,
        attachmentId,
        user.id,
      );

    return new StreamableFile(stream, {
      type: mimeType,
      disposition: `attachment; filename="${encodeURIComponent(originalName)}"`,
    });
  }

  @Delete(':attachmentId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.taskAttachmentsService.remove(
      workspaceId,
      projectId,
      taskId,
      attachmentId,
      user.id,
    );

    return {
      success: true,
      message: 'Attachment deleted successfully',
      data: null,
    };
  }
}
