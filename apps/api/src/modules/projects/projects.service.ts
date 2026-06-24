import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProjectStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectAccessService } from './project-access.service';

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
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async create(
    workspaceId: string,
    currentUserId: string,
    createProjectDto: CreateProjectDto,
  ) {
    await this.projectAccessService.assertCanCreateProject(
      workspaceId,
      currentUserId,
    );

    const normalizedName = createProjectDto.name.trim();
    const normalizedDescription = createProjectDto.description?.trim() || null;

    const project = await this.prisma.$transaction(async (transaction) => {
      return transaction.project.create({
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
    });

    return this.toProjectResponse(project, true);
  }

  async findAll(workspaceId: string, currentUserId: string) {
    const where = await this.projectAccessService.getVisibleProjectsWhere(
      workspaceId,
      currentUserId,
    );

    const projects = await this.prisma.project.findMany({
      where,
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

    return projects.map((project) => this.toProjectResponse(project, true));
  }

  async findOne(workspaceId: string, projectId: string, currentUserId: string) {
    await this.projectAccessService.assertCanReadProject(
      workspaceId,
      projectId,
      currentUserId,
    );

    const project = await this.findProjectOrThrow(workspaceId, projectId);

    return this.toProjectResponse(project, true);
  }

  async update(
    workspaceId: string,
    projectId: string,
    currentUserId: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    await this.projectAccessService.assertCanManageProject(
      workspaceId,
      projectId,
      currentUserId,
    );

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

    return this.toProjectResponse(project, true);
  }

  async archive(workspaceId: string, projectId: string, currentUserId: string) {
    await this.projectAccessService.assertCanManageProject(
      workspaceId,
      projectId,
      currentUserId,
    );

    const project = await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        status: ProjectStatus.ARCHIVED,
      },
      select: PROJECT_SELECT,
    });

    return this.toProjectResponse(project, true);
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

  private toProjectResponse(
    project: ProjectWithDetails,
    currentUserCanRead: boolean,
  ) {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      workspaceId: project.workspaceId,
      createdById: project.createdById,
      createdBy: project.createdBy,
      memberCount: project._count.members,
      currentUserCanRead,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
