import { Injectable, NotFoundException } from '@nestjs/common';
import { Permission } from '../../common/permissions/permission.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service';

@Injectable()
export class ProjectAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async assertCanCreateProject(workspaceId: string, userId: string) {
    return this.workspaceAccessService.assertPermission(
      workspaceId,
      userId,
      Permission.PROJECT_CREATE,
    );
  }

  async assertCanManageProject(
    workspaceId: string,
    projectId: string,
    userId: string,
  ) {
    await this.workspaceAccessService.assertPermission(
      workspaceId,
      userId,
      Permission.PROJECT_UPDATE,
    );

    await this.assertProjectExists(workspaceId, projectId);
  }

  async assertCanManageProjectMembers(
    workspaceId: string,
    projectId: string,
    userId: string,
  ) {
    await this.workspaceAccessService.assertPermission(
      workspaceId,
      userId,
      Permission.PROJECT_MEMBER_MANAGE,
    );

    await this.assertProjectExists(workspaceId, projectId);
  }

  async assertCanReadProject(
    workspaceId: string,
    projectId: string,
    userId: string,
  ) {
    const membership = await this.workspaceAccessService.assertMember(
      workspaceId,
      userId,
    );

    const canReadAllWorkspaceProjects =
      this.workspaceAccessService.hasPermission(
        membership.role,
        Permission.PROJECT_UPDATE,
      );

    if (canReadAllWorkspaceProjects) {
      await this.assertProjectExists(workspaceId, projectId);
      return;
    }

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId,
        members: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  async getVisibleProjectsWhere(workspaceId: string, userId: string) {
    const membership = await this.workspaceAccessService.assertMember(
      workspaceId,
      userId,
    );

    const canReadAllWorkspaceProjects =
      this.workspaceAccessService.hasPermission(
        membership.role,
        Permission.PROJECT_UPDATE,
      );

    if (canReadAllWorkspaceProjects) {
      return {
        workspaceId,
      };
    }

    return {
      workspaceId,
      members: {
        some: {
          userId,
        },
      },
    };
  }

  private async assertProjectExists(workspaceId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }
}
