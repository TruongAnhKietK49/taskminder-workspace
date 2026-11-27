import { apiClient } from "@/shared/lib/api-client";
import type { ApiResponse } from "@/shared/types/api.types";
import type {
  CreateTaskPayload,
  Task,
  TaskActivity,
  TaskAttachment,
  TaskComment,
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

  async getComments(workspaceId: string, projectId: string, taskId: string) {
    const response = await apiClient.get<
      ApiResponse<{ comments: TaskComment[] }>
    >(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`,
    );

    return response.data.data.comments;
  },

  async createComment(
    workspaceId: string,
    projectId: string,
    taskId: string,
    content: string,
  ) {
    const response = await apiClient.post<ApiResponse<{ comment: TaskComment }>>(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`,
      { content },
    );

    return response.data.data.comment;
  },

  async updateComment(
    workspaceId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    content: string,
  ) {
    const response = await apiClient.patch<
      ApiResponse<{ comment: TaskComment }>
    >(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
      { content },
    );

    return response.data.data.comment;
  },

  async deleteComment(
    workspaceId: string,
    projectId: string,
    taskId: string,
    commentId: string,
  ) {
    await apiClient.delete(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
    );
  },

  async getAttachments(workspaceId: string, projectId: string, taskId: string) {
    const response = await apiClient.get<
      ApiResponse<{ attachments: TaskAttachment[] }>
    >(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/attachments`,
    );

    return response.data.data.attachments;
  },

  async uploadAttachment(
    workspaceId: string,
    projectId: string,
    taskId: string,
    file: File,
  ) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<
      ApiResponse<{ attachment: TaskAttachment }>
    >(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data.data.attachment;
  },

  async downloadAttachment(
    workspaceId: string,
    projectId: string,
    taskId: string,
    attachmentId: string,
    originalName: string,
  ) {
    const response = await apiClient.get<Blob>(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}/download`,
      {
        responseType: "blob",
      },
    );

    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = originalName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  async deleteAttachment(
    workspaceId: string,
    projectId: string,
    taskId: string,
    attachmentId: string,
  ) {
    await apiClient.delete(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`,
    );
  },

  async getActivities(workspaceId: string, projectId: string, taskId: string) {
    const response = await apiClient.get<
      ApiResponse<{ activities: TaskActivity[] }>
    >(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/activities`,
    );

    return response.data.data.activities;
  },
};
