import { IsEnum } from 'class-validator';
import { WorkspaceRole } from '../../../generated/prisma/client';

export class UpdateWorkspaceMemberRoleDto {
  @IsEnum(WorkspaceRole)
  role!: WorkspaceRole;
}
