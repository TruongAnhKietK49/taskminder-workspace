import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { WorkspaceInvitationsService } from './workspace-invitations.service';

@Controller('workspace-invitations')
@UseGuards(JwtAuthGuard)
export class WorkspaceInvitationsController {
  constructor(
    private readonly workspaceInvitationsService: WorkspaceInvitationsService,
  ) {}

  @Post(':token/accept')
  @HttpCode(HttpStatus.OK)
  async accept(
    @Param('token') token: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const member = await this.workspaceInvitationsService.accept(
      token,
      user.id,
    );

    return {
      success: true,
      message: 'Workspace invitation accepted successfully',
      data: {
        member,
      },
    };
  }

  @Post(':token/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('token') token: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const invitation = await this.workspaceInvitationsService.reject(
      token,
      user.id,
    );

    return {
      success: true,
      message: 'Workspace invitation rejected successfully',
      data: {
        invitation,
      },
    };
  }
}
