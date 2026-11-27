import type { ProjectStatus } from "@/features/projects/types/project.types";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "DONE"
  | "BLOCKED"
  | "ARCHIVED";

export type ActiveTaskStatus = Exclude<TaskStatus, "ARCHIVED">;

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskSortField = "dueDate" | "createdAt" | "updatedAt" | "priority";
export type TaskSortOrder = "asc" | "desc";

export type TaskUserSummary = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
};

export type TaskProjectSummary = {
  id: string;
  name: string;
  status: ProjectStatus;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  createdById: string;
  assigneeId: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: TaskUserSummary;
  assignee: TaskUserSummary | null;
};

export type WorkspaceTask = Task & {
  project: TaskProjectSummary;
};

export type WorkspaceTaskSummary = {
  totalActive: number;
  byStatus: Record<ActiveTaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  assignedToMe: number;
  overdue: number;
  dueSoon: number;
};

export type TaskQueryParams = {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  unassigned?: boolean;
  assignedToMe?: boolean;
  includeArchived?: boolean;
  search?: string;
  sortBy?: TaskSortField;
  sortOrder?: TaskSortOrder;
};

export type CreateTaskPayload = {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
};

export type UpdateTaskPayload = {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
};

export type CreateTaskVariables = {
  workspaceId: string;
  projectId: string;
  payload: CreateTaskPayload;
};

export type UpdateTaskVariables = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  payload: UpdateTaskPayload;
};

export type ArchiveTaskVariables = {
  workspaceId: string;
  projectId: string;
  taskId: string;
};
