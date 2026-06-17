export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

export type WorkspaceInvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

export type WorkspaceBase = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type Workspace = WorkspaceBase & {
  currentUserRole: WorkspaceRole;
  memberCount: number;
};

export type CreateWorkspacePayload = {
  name: string;
  description?: string;
};

export type UpdateWorkspacePayload = {
  name?: string;
  description?: string;
};

export type UpdateWorkspaceVariables = {
  workspaceId: string;
  payload: UpdateWorkspacePayload;
};

export type WorkspaceMemberUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
};

export type WorkspaceMember = {
  id: string;
  workspaceId?: string;
  role: WorkspaceRole;
  joinedAt: string;
  updatedAt: string;
  user: WorkspaceMemberUser;
};

export type WorkspaceInvitationUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
};

export type WorkspaceInvitation = {
  id: string;
  workspaceId: string;
  email: string;
  role: Exclude<WorkspaceRole, "OWNER">;
  token: string;
  status: WorkspaceInvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  invitedBy: WorkspaceInvitationUser;
  acceptedBy: WorkspaceInvitationUser | null;
};

export type AddWorkspaceMemberPayload = {
  email: string;
  role: Exclude<WorkspaceRole, "OWNER">;
};

export type AddWorkspaceMemberVariables = {
  workspaceId: string;
  payload: AddWorkspaceMemberPayload;
};

export type InviteWorkspaceMemberPayload = {
  email: string;
  role: Exclude<WorkspaceRole, "OWNER">;
};

export type InviteWorkspaceMemberVariables = {
  workspaceId: string;
  payload: InviteWorkspaceMemberPayload;
};

export type UpdateWorkspaceMemberRoleVariables = {
  workspaceId: string;
  memberId: string;
  role: Exclude<WorkspaceRole, "OWNER">;
};

export type RemoveWorkspaceMemberVariables = {
  workspaceId: string;
  memberId: string;
};
