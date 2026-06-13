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
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceMembersService } from './workspace-members.service';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';
import { UpdateWorkspaceMemberRoleDto } from './dto/update-workspace-member-role.dto';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ) {
    const workspace = await this.workspacesService.create(
      user.id,
      createWorkspaceDto,
    );

    return {
      success: true,
      message: 'Workspace created successfully',
      data: {
        workspace,
      },
    };
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const workspaces = await this.workspacesService.findAll(user.id);

    return {
      success: true,
      message: 'Workspaces retrieved successfully',
      data: {
        workspaces,
      },
    };
  }

  @Get(':workspaceId')
  async findOne(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const workspace = await this.workspacesService.findOne(
      workspaceId,
      user.id,
    );

    return {
      success: true,
      message: 'Workspace retrieved successfully',
      data: {
        workspace,
      },
    };
  }

  @Patch(':workspaceId')
  async update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    const workspace = await this.workspacesService.update(
      workspaceId,
      user.id,
      updateWorkspaceDto,
    );

    return {
      success: true,
      message: 'Workspace updated successfully',
      data: {
        workspace,
      },
    };
  }

  @Delete(':workspaceId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.workspacesService.remove(workspaceId, user.id);

    return {
      success: true,
      message: 'Workspace deleted successfully',
      data: null,
    };
  }

  @Get(':workspaceId/members')
  async findMembers(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const members = await this.workspaceMembersService.findAll(
      workspaceId,
      user.id,
    );

    return {
      success: true,
      message: 'Workspace members retrieved successfully',
      data: {
        members,
      },
    };
  }

  @Post(':workspaceId/members')
  async addMember(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddWorkspaceMemberDto,
  ) {
    const member = await this.workspaceMembersService.add(
      workspaceId,
      user.id,
      dto,
    );

    return {
      success: true,
      message: 'Workspace member added successfully',
      data: {
        member,
      },
    };
  }

  @Patch(':workspaceId/members/:memberId/role')
  async updateMemberRole(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateWorkspaceMemberRoleDto,
  ) {
    const member = await this.workspaceMembersService.updateRole(
      workspaceId,
      memberId,
      user.id,
      dto,
    );

    return {
      success: true,
      message: 'Workspace member role updated successfully',
      data: {
        member,
      },
    };
  }

  @Delete(':workspaceId/members/:memberId')
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.workspaceMembersService.remove(workspaceId, memberId, user.id);

    return {
      success: true,
      message: 'Workspace member removed successfully',
      data: null,
    };
  }
}
