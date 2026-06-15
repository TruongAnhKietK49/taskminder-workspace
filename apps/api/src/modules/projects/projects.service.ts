import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProjectStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const PROJECT_SELECT = {
  id: true,
  name: true,
  description: true,
  status: true,
  workspaceId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
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
} as const;

type ProjectWithDetails = Prisma.ProjectGetPayload<{
  select: typeof PROJECT_SELECT;
}>;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async create(
    workspaceId: string,
    currentUserId: string,
    createProjectDto: CreateProjectDto,
  ) {
    await this.workspaceAccessService.assertCanUpdateWorkspace(
      workspaceId,
      currentUserId,
    );

    const normalizedName = createProjectDto.name.trim();
    const normalizedDescription = createProjectDto.description?.trim() || null;

    return this.prisma.$transaction(async (transaction) => {
      const project = await transaction.project.create({
        data: {
          name: normalizedName,
          description: normalizedDescription,
          workspaceId,
          createdById: currentUserId,
          members: {
            create: {
              userId: currentUserId,
            },
          },
        },
        select: PROJECT_SELECT,
      });

      return this.toProjectResponse(project);
    });
  }

  async findAll(workspaceId: string, currentUserId: string) {
    await this.workspaceAccessService.assertMember(workspaceId, currentUserId);

    const projects = await this.prisma.project.findMany({
      where: {
        workspaceId,
      },
      select: PROJECT_SELECT,
      orderBy: [
        {
          status: 'asc',
        },
        {
          updatedAt: 'desc',
        },
      ],
    });

    return projects.map((project) => this.toProjectResponse(project));
  }

  async findOne(workspaceId: string, projectId: string, currentUserId: string) {
    await this.workspaceAccessService.assertMember(workspaceId, currentUserId);

    const project = await this.findProjectOrThrow(workspaceId, projectId);

    return this.toProjectResponse(project);
  }

  async update(
    workspaceId: string,
    projectId: string,
    currentUserId: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    await this.workspaceAccessService.assertCanUpdateWorkspace(
      workspaceId,
      currentUserId,
    );

    await this.findProjectOrThrow(workspaceId, projectId);

    const updateData: {
      name?: string;
      description?: string | null;
      status?: ProjectStatus;
    } = {};

    if (updateProjectDto.name !== undefined) {
      updateData.name = updateProjectDto.name.trim();
    }

    if (updateProjectDto.description !== undefined) {
      updateData.description = updateProjectDto.description.trim() || null;
    }

    if (updateProjectDto.status !== undefined) {
      updateData.status = updateProjectDto.status;
    }

    const project = await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: updateData,
      select: PROJECT_SELECT,
    });

    return this.toProjectResponse(project);
  }

  async archive(workspaceId: string, projectId: string, currentUserId: string) {
    await this.workspaceAccessService.assertCanUpdateWorkspace(
      workspaceId,
      currentUserId,
    );

    await this.findProjectOrThrow(workspaceId, projectId);

    const project = await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        status: ProjectStatus.ARCHIVED,
      },
      select: PROJECT_SELECT,
    });

    return this.toProjectResponse(project);
  }

  private async findProjectOrThrow(workspaceId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId,
      },
      select: PROJECT_SELECT,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private toProjectResponse(project: ProjectWithDetails) {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      workspaceId: project.workspaceId,
      createdById: project.createdById,
      createdBy: project.createdBy,
      memberCount: project._count.members,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
