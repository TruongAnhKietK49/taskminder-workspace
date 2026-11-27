import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { GlobalSearchDto } from './dto/global-search.dto';
import { SearchService } from './search.service';

@Controller('workspaces/:workspaceId/search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Param('workspaceId') workspaceId: string,
    @Query() query: GlobalSearchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const results = await this.searchService.searchWorkspace(
      workspaceId,
      user.id,
      query.q,
    );

    return {
      success: true,
      message: 'Search completed successfully',
      data: results,
    };
  }
}
