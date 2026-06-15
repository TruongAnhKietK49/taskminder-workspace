import { WorkspaceRole } from '../../generated/prisma/client';
import { Permission } from './permission.enum';

export const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  [WorkspaceRole.OWNER]: [
    Permission.WORKSPACE_MANAGE,
    Permission.WORKSPACE_MEMBER_MANAGE,

    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_MEMBER_MANAGE,

    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_ASSIGN,
  ],

  [WorkspaceRole.ADMIN]: [
    Permission.WORKSPACE_MANAGE,
    Permission.WORKSPACE_MEMBER_MANAGE,

    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_MEMBER_MANAGE,

    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_ASSIGN,
  ],

  [WorkspaceRole.MEMBER]: [Permission.TASK_CREATE, Permission.TASK_UPDATE],
};
