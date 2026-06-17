import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  Prisma,
  UserStatus,
  WorkspaceInvitationStatus,
  WorkspaceRole,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InviteWorkspaceMemberDto } from './dto/invite-workspace-member.dto';
import { WorkspaceAccessService } from './workspace-access.service';

const WORKSPACE_INVITATION_SELECT = {
  id: true,
  workspaceId: true,
  email: true,
  role: true,
  token: true,
  status: true,
  expiresAt: true,
  acceptedAt: true,
  rejectedAt: true,
  createdAt: true,
  updatedAt: true,
  invitedBy: {
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
    },
  },
  acceptedBy: {
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
    },
  },
} as const;

const WORKSPACE_MEMBER_SELECT = {
  id: true,
  workspaceId: true,
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

const INVITATION_EXPIRES_IN_DAYS = 7;

@Injectable()
export class WorkspaceInvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async create(
    workspaceId: string,
    currentUserId: string,
    dto: InviteWorkspaceMemberDto,
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
        'Workspace admins can only invite members with MEMBER role',
      );
    }

    const normalizedEmail = dto.email.trim().toLowerCase();

    const invitedUser = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (invitedUser?.status && invitedUser.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('User account is not active');
    }

    if (invitedUser) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: invitedUser.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingMember) {
        throw new ConflictException(
          'User is already a member of this workspace',
        );
      }
    }

    const existingPendingInvitation =
      await this.prisma.workspaceInvitation.findFirst({
        where: {
          workspaceId,
          email: normalizedEmail,
          status: WorkspaceInvitationStatus.PENDING,
        },
        select: {
          id: true,
        },
      });

    if (existingPendingInvitation) {
      throw new ConflictException(
        'A pending invitation already exists for this email',
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRES_IN_DAYS);

    try {
      return await this.prisma.workspaceInvitation.create({
        data: {
          workspaceId,
          email: normalizedEmail,
          role: dto.role,
          token: this.generateInvitationToken(),
          invitedById: currentUserId,
          expiresAt,
        },
        select: WORKSPACE_INVITATION_SELECT,
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'A pending invitation already exists for this email',
        );
      }

      throw error;
    }
  }

  async findAll(workspaceId: string, currentUserId: string) {
    await this.workspaceAccessService.assertCanManageMembers(
      workspaceId,
      currentUserId,
    );

    return this.prisma.workspaceInvitation.findMany({
      where: {
        workspaceId,
      },
      select: WORKSPACE_INVITATION_SELECT,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async accept(token: string, currentUserId: string) {
    const invitation = await this.findInvitationByTokenOrThrow(token);

    this.assertPendingInvitation(invitation);

    const currentUser = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: currentUserId,
      },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    if (currentUser.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('User account is not active');
    }

    if (currentUser.email.toLowerCase() !== invitation.email) {
      throw new ForbiddenException(
        'This invitation does not belong to your email',
      );
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const member = await transaction.workspaceMember.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId: currentUser.id,
            role: invitation.role,
          },
          select: WORKSPACE_MEMBER_SELECT,
        });

        await transaction.workspaceInvitation.update({
          where: {
            id: invitation.id,
          },
          data: {
            status: WorkspaceInvitationStatus.ACCEPTED,
            acceptedById: currentUser.id,
            acceptedAt: new Date(),
          },
        });

        return member;
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

  async reject(token: string, currentUserId: string) {
    const invitation = await this.findInvitationByTokenOrThrow(token);

    this.assertPendingInvitation(invitation);

    const currentUser = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: currentUserId,
      },
      select: {
        email: true,
      },
    });

    if (currentUser.email.toLowerCase() !== invitation.email) {
      throw new ForbiddenException(
        'This invitation does not belong to your email',
      );
    }

    return this.prisma.workspaceInvitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: WorkspaceInvitationStatus.REJECTED,
        rejectedAt: new Date(),
      },
      select: WORKSPACE_INVITATION_SELECT,
    });
  }

  private async findInvitationByTokenOrThrow(token: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: {
        token,
      },
      select: WORKSPACE_INVITATION_SELECT,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return invitation;
  }

  private assertPendingInvitation(
    invitation: Prisma.WorkspaceInvitationGetPayload<{
      select: typeof WORKSPACE_INVITATION_SELECT;
    }>,
  ) {
    if (invitation.status !== WorkspaceInvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is no longer pending');
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      void this.prisma.workspaceInvitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: WorkspaceInvitationStatus.EXPIRED,
        },
      });

      throw new BadRequestException('Invitation is expired');
    }
  }

  private assertAssignableRole(role: WorkspaceRole): void {
    if (role === WorkspaceRole.OWNER) {
      throw new BadRequestException(
        'OWNER role cannot be assigned using this endpoint',
      );
    }
  }

  private generateInvitationToken() {
    return randomBytes(32).toString('hex');
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
