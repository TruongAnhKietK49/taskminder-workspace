import { Module } from '@nestjs/common';

import { PermissionsModule } from '../../common/permissions/permissions.module';

import { WorkspaceAccessService } from './workspace-access.service';
import { WorkspaceInvitationsController } from './workspace-invitations.controller';
import { WorkspaceInvitationsService } from './workspace-invitations.service';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [PermissionsModule],

  controllers: [WorkspacesController, WorkspaceInvitationsController],

  providers: [
    WorkspacesService,
    WorkspaceMembersService,
    WorkspaceInvitationsService,
    WorkspaceAccessService,
  ],

  exports: [
    WorkspacesService,
    WorkspaceMembersService,
    WorkspaceInvitationsService,
    WorkspaceAccessService,
  ],
})
export class WorkspacesModule {}
