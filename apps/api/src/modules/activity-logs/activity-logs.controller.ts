import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ActivityLogsService } from './activity-logs.service';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';

@Controller('workspaces/:workspaceId/activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Query() query: QueryActivityLogsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const logs = await this.activityLogsService.findByWorkspace(
      workspaceId,
      user.id,
      query,
    );

    return {
      success: true,
      message: 'Activity logs retrieved successfully',
      data: { logs },
    };
  }
}
