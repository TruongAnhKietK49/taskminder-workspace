import type { WorkspaceRole } from "@/features/workspaces/types/workspace.types";

export const WORKSPACE_NAME_MAX_LENGTH = 100;
export const WORKSPACE_DESCRIPTION_MAX_LENGTH = 500;

export const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: "Chủ sở hữu",
  ADMIN: "Quản trị viên",
  MEMBER: "Thành viên",
};
