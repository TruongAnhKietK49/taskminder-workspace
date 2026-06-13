export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

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
  role: WorkspaceRole;
  joinedAt: string;
  updatedAt: string;
  user: WorkspaceMemberUser;
};

export type AddWorkspaceMemberPayload = {
  email: string;
  role: Exclude<WorkspaceRole, "OWNER">;
};

export type AddWorkspaceMemberVariables = {
  workspaceId: string;
  payload: AddWorkspaceMemberPayload;
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
