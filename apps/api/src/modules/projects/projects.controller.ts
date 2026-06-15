import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('workspaces/:workspaceId/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    const project = await this.projectsService.create(
      workspaceId,
      user.id,
      createProjectDto,
    );

    return {
      success: true,
      message: 'Project created successfully',
      data: {
        project,
      },
    };
  }

  @Get()
  async findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const projects = await this.projectsService.findAll(workspaceId, user.id);

    return {
      success: true,
      message: 'Projects retrieved successfully',
      data: {
        projects,
      },
    };
  }

  @Get(':projectId')
  async findOne(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const project = await this.projectsService.findOne(
      workspaceId,
      projectId,
      user.id,
    );

    return {
      success: true,
      message: 'Project retrieved successfully',
      data: {
        project,
      },
    };
  }

  @Patch(':projectId')
  async update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    const project = await this.projectsService.update(
      workspaceId,
      projectId,
      user.id,
      updateProjectDto,
    );

    return {
      success: true,
      message: 'Project updated successfully',
      data: {
        project,
      },
    };
  }

  @Delete(':projectId')
  @HttpCode(HttpStatus.OK)
  async archive(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const project = await this.projectsService.archive(
      workspaceId,
      projectId,
      user.id,
    );

    return {
      success: true,
      message: 'Project archived successfully',
      data: {
        project,
      },
    };
  }
}
