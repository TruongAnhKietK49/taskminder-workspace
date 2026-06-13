import { Module } from '@nestjs/common';
import { WorkspaceAccessService } from './workspace-access.service';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  controllers: [WorkspacesController],
  providers: [
    WorkspacesService,
    WorkspaceMembersService,
    WorkspaceAccessService,
  ],
  exports: [WorkspacesService, WorkspaceMembersService, WorkspaceAccessService],
})
export class WorkspacesModule {}
