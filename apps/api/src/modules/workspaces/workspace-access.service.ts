import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  WorkspaceMemberTarget,
  WorkspaceMembershipAccess,
} from './types/workspace-access.type';
import { PermissionService } from '../../common/permissions/permission.service';
import { Permission } from '../../common/permissions/permission.enum';

@Injectable()
export class WorkspaceAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: PermissionService,
  ) {}

  hasPermission(role: WorkspaceRole, permission: Permission): boolean {
    return this.permissionService.hasPermission(role, permission);
  }

  async assertPermission(
    workspaceId: string,
    userId: string,
    permission: Permission,
  ): Promise<WorkspaceMembershipAccess> {
    const membership = await this.getMembership(workspaceId, userId);

    const allowed = this.hasPermission(membership.role, permission);

    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return membership;
  }

  async getMembership(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMembershipAccess> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: {
        id: true,
        workspaceId: true,
        userId: true,
        role: true,
      },
    });

    if (!membership) {
      return this.throwWorkspaceAccessError(workspaceId);
    }

    return membership;
  }

  async assertMember(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMembershipAccess> {
    return this.getMembership(workspaceId, userId);
  }

  async assertCanUpdateWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMembershipAccess> {
    return this.assertPermission(
      workspaceId,
      userId,
      Permission.WORKSPACE_MANAGE,
    );
  }

  async assertCanManageMembers(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMembershipAccess> {
    return this.assertPermission(
      workspaceId,
      userId,
      Permission.WORKSPACE_MEMBER_MANAGE,
    );
  }

  async assertOwner(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMembershipAccess> {
    const membership = await this.getMembership(workspaceId, userId);

    if (membership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Only the workspace owner can perform this action',
      );
    }

    return membership;
  }

  async getTargetMember(
    workspaceId: string,
    memberId: string,
  ): Promise<WorkspaceMemberTarget> {
    const member = await this.prisma.workspaceMember.findFirst({
      where: {
        id: memberId,
        workspaceId,
      },
      select: {
        id: true,
        workspaceId: true,
        userId: true,
        role: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

    return member;
  }

  private async throwWorkspaceAccessError(workspaceId: string): Promise<never> {
    const workspace = await this.prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
      select: {
        id: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    throw new ForbiddenException('You do not have access to this workspace');
  }
}
