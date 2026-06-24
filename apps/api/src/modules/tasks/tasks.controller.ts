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
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('workspaces/:workspaceId/projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTaskDto,
  ) {
    const task = await this.tasksService.create(
      workspaceId,
      projectId,
      user.id,
      dto,
    );

    return {
      success: true,
      message: 'Task created successfully',
      data: {
        task,
      },
    };
  }

  @Get()
  async findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const tasks = await this.tasksService.findAll(
      workspaceId,
      projectId,
      user.id,
    );

    return {
      success: true,
      message: 'Tasks retrieved successfully',
      data: {
        tasks,
      },
    };
  }

  @Get(':taskId')
  async findOne(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.tasksService.findOne(
      workspaceId,
      projectId,
      taskId,
      user.id,
    );

    return {
      success: true,
      message: 'Task retrieved successfully',
      data: {
        task,
      },
    };
  }

  @Patch(':taskId')
  async update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTaskDto,
  ) {
    const task = await this.tasksService.update(
      workspaceId,
      projectId,
      taskId,
      user.id,
      dto,
    );

    return {
      success: true,
      message: 'Task updated successfully',
      data: {
        task,
      },
    };
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.OK)
  async archive(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.tasksService.archive(
      workspaceId,
      projectId,
      taskId,
      user.id,
    );

    return {
      success: true,
      message: 'Task archived successfully',
      data: {
        task,
      },
    };
  }
}
