import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ChatGateway } from './chat.gateway';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { PresenceService } from './presence.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class PresenceController {
  constructor(
    private readonly presenceService: PresenceService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('presence/me')
  async getMyPresence(@CurrentUser() user: AuthenticatedUser) {
    const presence = await this.presenceService.getUserPresence(user.id);

    return {
      success: true,
      message: 'Presence retrieved successfully',
      data: { presence },
    };
  }

  @Patch('presence/me')
  async updateMyPresence(
    @Body() dto: UpdatePresenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const presence = await this.presenceService.setManualStatus(
      user.id,
      dto.status,
      dto.statusMessage,
    );

    await this.chatGateway.emitPresenceUpdate(user.id, presence);

    return {
      success: true,
      message: 'Presence updated successfully',
      data: { presence },
    };
  }

  @Get('workspaces/:workspaceId/presence')
  async getWorkspacePresences(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const presences = await this.presenceService.getWorkspacePresences(
      workspaceId,
      user.id,
    );

    return {
      success: true,
      message: 'Workspace presences retrieved successfully',
      data: { presences },
    };
  }
}
