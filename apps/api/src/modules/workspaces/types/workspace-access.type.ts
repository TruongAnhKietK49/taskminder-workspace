import { WorkspaceRole } from '../../../generated/prisma/client';

export type WorkspaceMembershipAccess = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
};

export type WorkspaceMemberTarget = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
};
