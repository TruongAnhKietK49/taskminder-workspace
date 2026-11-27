import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { TaskActivitiesService } from './task-activities.service';

@Controller(
  'workspaces/:workspaceId/projects/:projectId/tasks/:taskId/activities',
)
@UseGuards(JwtAuthGuard)
export class TaskActivitiesController {
  constructor(private readonly taskActivitiesService: TaskActivitiesService) {}

  @Get()
  async findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const activities = await this.taskActivitiesService.findAll(
      workspaceId,
      projectId,
      taskId,
      user.id,
    );

    return {
      success: true,
      message: 'Task activities retrieved successfully',
      data: {
        activities,
      },
    };
  }
}
