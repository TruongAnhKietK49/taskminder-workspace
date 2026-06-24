import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/project.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { TaskAccessService } from './task-access.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [WorkspacesModule, ProjectsModule],
  controllers: [TasksController],
  providers: [TasksService, TaskAccessService],
  exports: [TasksService, TaskAccessService],
})
export class TasksModule {}
