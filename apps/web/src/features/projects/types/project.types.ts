export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "ARCHIVED";

export type ProjectCreator = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  workspaceId: string;
  createdById: string;
  createdBy: ProjectCreator;
  memberCount: number;
  currentUserCanRead: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectPayload = {
  name: string;
  description?: string;
};

export type UpdateProjectPayload = {
  name?: string;
  description?: string;
  status?: ProjectStatus;
};

export type CreateProjectVariables = {
  workspaceId: string;
  payload: CreateProjectPayload;
};

export type UpdateProjectVariables = {
  workspaceId: string;
  projectId: string;
  payload: UpdateProjectPayload;
};

export type ArchiveProjectVariables = {
  workspaceId: string;
  projectId: string;
};
