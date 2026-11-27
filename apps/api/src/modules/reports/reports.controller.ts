import {
  Controller,
  Get,
  Param,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ReportsService } from './reports.service';

@Controller('workspaces/:workspaceId/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  async getOverview(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const report = await this.reportsService.getWorkspaceOverview(
      workspaceId,
      user.id,
    );

    return {
      success: true,
      message: 'Workspace report generated successfully',
      data: { report },
    };
  }

  @Get('export.csv')
  async exportCsv(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StreamableFile> {
    const { filename, content } = await this.reportsService.exportTasksCsv(
      workspaceId,
      user.id,
    );

    return new StreamableFile(Buffer.from(content, 'utf-8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
