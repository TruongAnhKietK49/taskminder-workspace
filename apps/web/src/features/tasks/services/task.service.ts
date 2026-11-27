import { apiClient } from "@/shared/lib/api-client";
import type { ApiResponse } from "@/shared/types/api.types";
import type {
  CreateTaskPayload,
  Task,
  TaskQueryParams,
  UpdateTaskPayload,
  WorkspaceTask,
  WorkspaceTaskSummary,
} from "@/features/tasks/types/task.types";

type WorkspaceTasksResponseData = {
  tasks: WorkspaceTask[];
};

type WorkspaceTaskSummaryResponseData = {
  summary: WorkspaceTaskSummary;
};

type ProjectTasksResponseData = {
  tasks: Task[];
};

type TaskResponseData = {
  task: Task;
};

function cleanQueryParams(params?: TaskQueryParams): Record<string, string | boolean> {
  if (!params) {
    return {};
  }

  const cleaned: Record<string, string | boolean> = {};

  if (params.projectId) {
    cleaned.projectId = params.projectId;
  }

  if (params.status) {
    cleaned.status = params.status;
  }

  if (params.priority) {
    cleaned.priority = params.priority;
  }

  if (params.assigneeId) {
    cleaned.assigneeId = params.assigneeId;
  }

  if (params.unassigned === true) {
    cleaned.unassigned = true;
  }

  if (params.assignedToMe === true) {
    cleaned.assignedToMe = true;
  }

  if (params.includeArchived === true) {
    cleaned.includeArchived = true;
  }

  const trimmedSearch = params.search?.trim();
  if (trimmedSearch) {
    cleaned.search = trimmedSearch;
  }

  if (params.sortBy) {
    cleaned.sortBy = params.sortBy;
  }

  if (params.sortOrder) {
    cleaned.sortOrder = params.sortOrder;
  }

  return cleaned;
}

export const taskService = {
  async getWorkspaceTasks(workspaceId: string, params?: TaskQueryParams) {
    const response = await apiClient.get<
      ApiResponse<WorkspaceTasksResponseData>
    >(`/workspaces/${workspaceId}/tasks`, {
      params: cleanQueryParams(params),
    });

    return response.data.data.tasks;
  },

  async getWorkspaceSummary(workspaceId: string) {
    const response = await apiClient.get<
      ApiResponse<WorkspaceTaskSummaryResponseData>
    >(`/workspaces/${workspaceId}/tasks/summary`);

    return response.data.data.summary;
  },

  async getProjectTasks(
    workspaceId: string,
    projectId: string,
    params?: TaskQueryParams,
  ) {
    const response = await apiClient.get<ApiResponse<ProjectTasksResponseData>>(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
      {
        params: cleanQueryParams(params),
      },
    );

    return response.data.data.tasks;
  },

  async create(
    workspaceId: string,
    projectId: string,
    payload: CreateTaskPayload,
  ) {
    const response = await apiClient.post<ApiResponse<TaskResponseData>>(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
      payload,
    );

    return response.data.data.task;
  },

  async update(
    workspaceId: string,
    projectId: string,
    taskId: string,
    payload: UpdateTaskPayload,
  ) {
    const response = await apiClient.patch<ApiResponse<TaskResponseData>>(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
      payload,
    );

    return response.data.data.task;
  },

  async archive(workspaceId: string, projectId: string, taskId: string) {
    const response = await apiClient.delete<ApiResponse<TaskResponseData>>(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
    );

    return response.data.data.task;
  },
};
