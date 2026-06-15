import { apiClient } from "@/shared/lib/api-client";
import type { ApiResponse } from "@/shared/types/api.types";
import type {
  CreateProjectPayload,
  Project,
  UpdateProjectPayload,
} from "@/features/projects/types/project.types";

type ProjectsResponseData = {
  projects: Project[];
};

type ProjectResponseData = {
  project: Project;
};

export const projectService = {
  async getAll(workspaceId: string) {
    const response = await apiClient.get<ApiResponse<ProjectsResponseData>>(
      `/workspaces/${workspaceId}/projects`,
    );

    return response.data.data.projects;
  },

  async getById(workspaceId: string, projectId: string) {
    const response = await apiClient.get<ApiResponse<ProjectResponseData>>(
      `/workspaces/${workspaceId}/projects/${projectId}`,
    );

    return response.data.data.project;
  },

  async create(workspaceId: string, payload: CreateProjectPayload) {
    const response = await apiClient.post<ApiResponse<ProjectResponseData>>(
      `/workspaces/${workspaceId}/projects`,
      payload,
    );

    return response.data.data.project;
  },

  async update(
    workspaceId: string,
    projectId: string,
    payload: UpdateProjectPayload,
  ) {
    const response = await apiClient.patch<ApiResponse<ProjectResponseData>>(
      `/workspaces/${workspaceId}/projects/${projectId}`,
      payload,
    );

    return response.data.data.project;
  },

  async archive(workspaceId: string, projectId: string) {
    const response = await apiClient.delete<ApiResponse<ProjectResponseData>>(
      `/workspaces/${workspaceId}/projects/${projectId}`,
    );

    return response.data.data.project;
  },
};
