import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';
import { UpdateWorkspaceMemberRoleDto } from './dto/update-workspace-member-role.dto';
import { WorkspaceAccessService } from './workspace-access.service';

const WORKSPACE_MEMBER_SELECT = {
  id: true,
  role: true,
  joinedAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      status: true,
    },
  },
} as const;

@Injectable()
export class WorkspaceMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async findAll(workspaceId: string, currentUserId: string) {
    await this.workspaceAccessService.assertMember(workspaceId, currentUserId);

    return this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
      },
      select: WORKSPACE_MEMBER_SELECT,
      orderBy: [
        {
          role: 'asc',
        },
        {
          joinedAt: 'asc',
        },
      ],
    });
  }

  async add(
    workspaceId: string,
    currentUserId: string,
    dto: AddWorkspaceMemberDto,
  ) {
    const currentMembership =
      await this.workspaceAccessService.assertCanManageMembers(
        workspaceId,
        currentUserId,
      );

    this.assertAssignableRole(dto.role);

    if (
      currentMembership.role === WorkspaceRole.ADMIN &&
      dto.role !== WorkspaceRole.MEMBER
    ) {
      throw new ForbiddenException(
        'Workspace admins can only add members with MEMBER role',
      );
    }

    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('User account is not active');
    }

    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this workspace');
    }

    try {
      return await this.prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: user.id,
          role: dto.role,
        },
        select: WORKSPACE_MEMBER_SELECT,
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'User is already a member of this workspace',
        );
      }

      throw error;
    }
  }

  async updateRole(
    workspaceId: string,
    memberId: string,
    currentUserId: string,
    dto: UpdateWorkspaceMemberRoleDto,
  ) {
    await this.workspaceAccessService.assertOwner(workspaceId, currentUserId);

    this.assertAssignableRole(dto.role);

    const targetMember = await this.workspaceAccessService.getTargetMember(
      workspaceId,
      memberId,
    );

    if (targetMember.role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Workspace owner role cannot be changed');
    }

    if (targetMember.role === dto.role) {
      return this.prisma.workspaceMember.findUniqueOrThrow({
        where: {
          id: targetMember.id,
        },
        select: WORKSPACE_MEMBER_SELECT,
      });
    }

    return this.prisma.workspaceMember.update({
      where: {
        id: targetMember.id,
      },
      data: {
        role: dto.role,
      },
      select: WORKSPACE_MEMBER_SELECT,
    });
  }

  async remove(
    workspaceId: string,
    memberId: string,
    currentUserId: string,
  ): Promise<void> {
    const currentMembership =
      await this.workspaceAccessService.assertCanManageMembers(
        workspaceId,
        currentUserId,
      );

    const targetMember = await this.workspaceAccessService.getTargetMember(
      workspaceId,
      memberId,
    );

    if (targetMember.role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Workspace owner cannot be removed');
    }

    if (targetMember.userId === currentUserId) {
      throw new BadRequestException(
        'You cannot remove yourself using this endpoint',
      );
    }

    if (
      currentMembership.role === WorkspaceRole.ADMIN &&
      targetMember.role !== WorkspaceRole.MEMBER
    ) {
      throw new ForbiddenException(
        'Workspace admins can only remove members with MEMBER role',
      );
    }

    await this.prisma.workspaceMember.delete({
      where: {
        id: targetMember.id,
      },
    });
  }

  private assertAssignableRole(role: WorkspaceRole): void {
    if (role === WorkspaceRole.OWNER) {
      throw new BadRequestException(
        'OWNER role cannot be assigned using this endpoint',
      );
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
