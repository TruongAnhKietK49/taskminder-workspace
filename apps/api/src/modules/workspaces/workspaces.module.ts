import { Module } from '@nestjs/common';

import { PermissionsModule } from '../../common/permissions/permissions.module';

import { WorkspaceAccessService } from './workspace-access.service';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [PermissionsModule],

  controllers: [WorkspacesController],

  providers: [
    WorkspacesService,
    WorkspaceMembersService,
    WorkspaceAccessService,
  ],

  exports: [WorkspacesService, WorkspaceMembersService, WorkspaceAccessService],
})
export class WorkspacesModule {}
