import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto';
import { TaskCommentsService } from './task-comments.service';

@Controller(
  'workspaces/:workspaceId/projects/:projectId/tasks/:taskId/comments',
)
@UseGuards(JwtAuthGuard)
export class TaskCommentsController {
  constructor(private readonly taskCommentsService: TaskCommentsService) {}

  @Get()
  async findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const comments = await this.taskCommentsService.findAll(
      workspaceId,
      projectId,
      taskId,
      user.id,
    );

    return {
      success: true,
      message: 'Task comments retrieved successfully',
      data: {
        comments,
      },
    };
  }

  @Post()
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTaskCommentDto,
  ) {
    const comment = await this.taskCommentsService.create(
      workspaceId,
      projectId,
      taskId,
      user.id,
      dto,
    );

    return {
      success: true,
      message: 'Comment added successfully',
      data: {
        comment,
      },
    };
  }

  @Patch(':commentId')
  async update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTaskCommentDto,
  ) {
    const comment = await this.taskCommentsService.update(
      workspaceId,
      projectId,
      taskId,
      commentId,
      user.id,
      dto,
    );

    return {
      success: true,
      message: 'Comment updated successfully',
      data: {
        comment,
      },
    };
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.taskCommentsService.remove(
      workspaceId,
      projectId,
      taskId,
      commentId,
      user.id,
    );

    return {
      success: true,
      message: 'Comment deleted successfully',
      data: null,
    };
  }
}
