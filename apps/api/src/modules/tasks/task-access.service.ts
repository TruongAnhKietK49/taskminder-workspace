import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Permission } from '../../common/permissions/permission.enum';
import { WorkspaceRole } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service';

@Injectable()
export class TaskAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async assertCanReadProjectTasks(
    workspaceId: string,
    projectId: string,
    currentUserId: string,
  ) {
    await this.projectAccessService.assertCanReadProject(
      workspaceId,
      projectId,
      currentUserId,
    );
  }

  async assertCanCreateTask(
    workspaceId: string,
    projectId: string,
    currentUserId: string,
  ) {
    await this.projectAccessService.assertCanReadProject(
      workspaceId,
      projectId,
      currentUserId,
    );

    await this.workspaceAccessService.assertPermission(
      workspaceId,
      currentUserId,
      Permission.TASK_CREATE,
    );
  }

  async assertCanUpdateTask(
    workspaceId: string,
    projectId: string,
    taskId: string,
    currentUserId: string,
  ) {
    await this.projectAccessService.assertCanReadProject(
      workspaceId,
      projectId,
      currentUserId,
    );

    const membership = await this.workspaceAccessService.assertPermission(
      workspaceId,
      currentUserId,
      Permission.TASK_UPDATE,
    );

    const task = await this.findTaskAccessTarget(
      workspaceId,
      projectId,
      taskId,
    );

    const canUpdateAnyTask =
      membership.role === WorkspaceRole.OWNER ||
      membership.role === WorkspaceRole.ADMIN;

    if (canUpdateAnyTask) {
      return task;
    }

    const isTaskCreator = task.createdById === currentUserId;
    const isTaskAssignee = task.assigneeId === currentUserId;

    if (!isTaskCreator && !isTaskAssignee) {
      throw new ForbiddenException(
        'You can only update tasks created by or assigned to you',
      );
    }

    return task;
  }

  async assertCanDeleteTask(
    workspaceId: string,
    projectId: string,
    taskId: string,
    currentUserId: string,
  ) {
    return this.assertCanUpdateTask(
      workspaceId,
      projectId,
      taskId,
      currentUserId,
    );
  }

  async assertAssigneeIsProjectMember(
    projectId: string,
    assigneeId?: string | null,
  ) {
    if (!assigneeId) {
      return;
    }

    const projectMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: assigneeId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!projectMember) {
      throw new ForbiddenException('Assignee must be a project member');
    }
  }

  private async findTaskAccessTarget(
    workspaceId: string,
    projectId: string,
    taskId: string,
  ) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
        project: {
          workspaceId,
        },
      },
      select: {
        id: true,
        createdById: true,
        assigneeId: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }
}
