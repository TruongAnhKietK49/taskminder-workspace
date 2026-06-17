import { IsEmail, IsEnum } from 'class-validator';
import { WorkspaceRole } from '../../../generated/prisma/client';

export class InviteWorkspaceMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(WorkspaceRole)
  role!: WorkspaceRole;
}
