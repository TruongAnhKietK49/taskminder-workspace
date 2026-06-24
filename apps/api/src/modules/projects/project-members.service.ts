import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { ProjectAccessService } from './project-access.service';

const PROJECT_MEMBER_SELECT = {
  id: true,
  projectId: true,
  joinedAt: true,
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
export class ProjectMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async findAll(workspaceId: string, projectId: string, currentUserId: string) {
    await this.projectAccessService.assertCanReadProject(
      workspaceId,
      projectId,
      currentUserId,
    );

    return this.prisma.projectMember.findMany({
      where: {
        projectId,
      },
      select: PROJECT_MEMBER_SELECT,
      orderBy: {
        joinedAt: 'asc',
      },
    });
  }

  async add(
    workspaceId: string,
    projectId: string,
    currentUserId: string,
    dto: AddProjectMemberDto,
  ) {
    await this.projectAccessService.assertCanManageProjectMembers(
      workspaceId,
      projectId,
      currentUserId,
    );

    const normalizedEmail = dto.email.trim().toLowerCase();

    const workspaceMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: {
          email: normalizedEmail,
          status: 'ACTIVE',
        },
      },
      select: {
        userId: true,
      },
    });

    if (!workspaceMember) {
      throw new BadRequestException(
        'User must be an active workspace member before joining this project',
      );
    }

    const existingProjectMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: workspaceMember.userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingProjectMember) {
      throw new ConflictException('User is already a member of this project');
    }

    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId: workspaceMember.userId,
      },
      select: PROJECT_MEMBER_SELECT,
    });
  }

  async remove(
    workspaceId: string,
    projectId: string,
    memberId: string,
    currentUserId: string,
  ) {
    await this.projectAccessService.assertCanManageProjectMembers(
      workspaceId,
      projectId,
      currentUserId,
    );

    const member = await this.prisma.projectMember.findFirst({
      where: {
        id: memberId,
        projectId,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    if (member.userId === currentUserId) {
      throw new BadRequestException(
        'You cannot remove yourself from project using this endpoint',
      );
    }

    await this.prisma.projectMember.delete({
      where: {
        id: member.id,
      },
    });
  }
}
