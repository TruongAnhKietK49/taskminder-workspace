import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/project.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { TaskAccessService } from './task-access.service';
import { TaskActivitiesController } from './task-activities.controller';
import { TaskActivitiesService } from './task-activities.service';
import { TaskAttachmentsController } from './task-attachments.controller';
import { TaskAttachmentsService } from './task-attachments.service';
import { TaskCommentsController } from './task-comments.controller';
import { TaskCommentsService } from './task-comments.service';
import { TaskRemindersController } from './task-reminders.controller';
import { TaskRemindersService } from './task-reminders.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { WorkspaceTasksController } from './workspace-tasks.controller';

@Module({
  imports: [WorkspacesModule, ProjectsModule],
  controllers: [
    TasksController,
    WorkspaceTasksController,
    TaskCommentsController,
    TaskAttachmentsController,
    TaskActivitiesController,
    TaskRemindersController,
  ],
  providers: [
    TasksService,
    TaskAccessService,
    TaskCommentsService,
    TaskAttachmentsService,
    TaskActivitiesService,
    TaskRemindersService,
  ],
  exports: [
    TasksService,
    TaskAccessService,
    TaskCommentsService,
    TaskAttachmentsService,
    TaskActivitiesService,
    TaskRemindersService,
  ],
})
export class TasksModule {}
