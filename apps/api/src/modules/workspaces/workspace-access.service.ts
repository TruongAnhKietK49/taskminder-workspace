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

@Injectable()
export class WorkspaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

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
    const membership = await this.getMembership(workspaceId, userId);

    if (
      membership.role !== WorkspaceRole.OWNER &&
      membership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this workspace',
      );
    }

    return membership;
  }

  async assertCanManageMembers(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMembershipAccess> {
    const membership = await this.getMembership(workspaceId, userId);

    if (
      membership.role !== WorkspaceRole.OWNER &&
      membership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage workspace members',
      );
    }

    return membership;
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
