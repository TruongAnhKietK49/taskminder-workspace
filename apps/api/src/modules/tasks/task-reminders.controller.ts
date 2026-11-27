import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateTaskReminderDto } from './dto/create-task-reminder.dto';
import { TaskRemindersService } from './task-reminders.service';

@Controller(
  'workspaces/:workspaceId/projects/:projectId/tasks/:taskId/reminders',
)
@UseGuards(JwtAuthGuard)
export class TaskRemindersController {
  constructor(private readonly taskRemindersService: TaskRemindersService) {}

  @Get()
  async findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const reminders = await this.taskRemindersService.findAll(
      workspaceId,
      projectId,
      taskId,
      user.id,
    );

    return {
      success: true,
      message: 'Task reminders retrieved successfully',
      data: {
        reminders,
      },
    };
  }

  @Post()
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTaskReminderDto,
  ) {
    const reminder = await this.taskRemindersService.create(
      workspaceId,
      projectId,
      taskId,
      user.id,
      dto,
    );

    return {
      success: true,
      message: 'Task reminder created successfully',
      data: {
        reminder,
      },
    };
  }

  @Delete(':reminderId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('reminderId', ParseUUIDPipe) reminderId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.taskRemindersService.remove(
      workspaceId,
      projectId,
      taskId,
      reminderId,
      user.id,
    );

    return {
      success: true,
      message: 'Task reminder deleted successfully',
      data: null,
    };
  }
}
