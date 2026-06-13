import { Injectable } from '@nestjs/common';
import { WorkspaceRole } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceAccessService } from './workspace-access.service';

const WORKSPACE_SELECT = {
  id: true,
  name: true,
  description: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async create(userId: string, createWorkspaceDto: CreateWorkspaceDto) {
    const normalizedName = createWorkspaceDto.name.trim();
    const normalizedDescription =
      createWorkspaceDto.description?.trim() || null;

    return this.prisma.$transaction(async (transaction) => {
      const workspace = await transaction.workspace.create({
        data: {
          name: normalizedName,
          description: normalizedDescription,
          ownerId: userId,
        },
        select: WORKSPACE_SELECT,
      });

      await transaction.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: WorkspaceRole.OWNER,
        },
      });

      return {
        ...workspace,
        currentUserRole: WorkspaceRole.OWNER,
        memberCount: 1,
      };
    });
  }

  async findAll(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: {
        userId,
      },
      select: {
        role: true,
        workspace: {
          select: {
            ...WORKSPACE_SELECT,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        workspace: {
          updatedAt: 'desc',
        },
      },
    });

    return memberships.map(({ workspace, role }) => ({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      ownerId: workspace.ownerId,
      currentUserRole: role,
      memberCount: workspace._count.members,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    }));
  }

  async findOne(workspaceId: string, userId: string) {
    const membership = await this.workspaceAccessService.assertMember(
      workspaceId,
      userId,
    );

    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: {
        id: workspaceId,
      },
      select: {
        ...WORKSPACE_SELECT,
        owner: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      ownerId: workspace.ownerId,
      owner: workspace.owner,
      currentUserRole: membership.role,
      memberCount: workspace._count.members,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  async update(
    workspaceId: string,
    userId: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    await this.workspaceAccessService.assertCanUpdateWorkspace(
      workspaceId,
      userId,
    );

    const updateData: {
      name?: string;
      description?: string;
    } = {};

    if (updateWorkspaceDto.name !== undefined) {
      updateData.name = updateWorkspaceDto.name.trim();
    }

    if (updateWorkspaceDto.description !== undefined) {
      updateData.description = updateWorkspaceDto.description.trim();
    }

    return this.prisma.workspace.update({
      where: {
        id: workspaceId,
      },
      data: updateData,
      select: WORKSPACE_SELECT,
    });
  }

  async remove(workspaceId: string, userId: string) {
    await this.workspaceAccessService.assertOwner(workspaceId, userId);

    await this.prisma.workspace.delete({
      where: {
        id: workspaceId,
      },
    });

    return null;
  }

  async findMembers(workspaceId: string, userId: string) {
    await this.workspaceAccessService.assertMember(workspaceId, userId);

    const members = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
      },
      select: {
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
      },
      orderBy: [
        {
          role: 'asc',
        },
        {
          joinedAt: 'asc',
        },
      ],
    });

    return members.map((member) => ({
      id: member.id,
      role: member.role,
      joinedAt: member.joinedAt,
      updatedAt: member.updatedAt,
      user: member.user,
    }));
  }
}
