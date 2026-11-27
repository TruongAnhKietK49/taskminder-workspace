import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { QueryWorkspaceTasksDto } from './dto/query-tasks.dto';
import { TasksService } from './tasks.service';

@Controller('workspaces/:workspaceId/tasks')
@UseGuards(JwtAuthGuard)
export class WorkspaceTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryWorkspaceTasksDto,
  ) {
    const tasks = await this.tasksService.findWorkspaceTasks(
      workspaceId,
      user.id,
      query,
    );

    return {
      success: true,
      message: 'Workspace tasks retrieved successfully',
      data: {
        tasks,
      },
    };
  }

  @Get('summary')
  async getSummary(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const summary = await this.tasksService.getWorkspaceTaskSummary(
      workspaceId,
      user.id,
    );

    return {
      success: true,
      message: 'Workspace task summary retrieved successfully',
      data: {
        summary,
      },
    };
  }
}
