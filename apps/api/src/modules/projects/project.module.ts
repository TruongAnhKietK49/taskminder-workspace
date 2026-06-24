import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ProjectAccessService } from './project-access.service';
import { ProjectMembersService } from './project-members.service';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectAccessService, ProjectMembersService],
  exports: [ProjectsService, ProjectAccessService, ProjectMembersService],
})
export class ProjectsModule {}
