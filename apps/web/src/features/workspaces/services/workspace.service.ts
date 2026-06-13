import { apiClient } from "@/shared/lib/api-client";
import type { ApiResponse } from "@/shared/types/api.types";
import type {
  AddWorkspaceMemberPayload,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  Workspace,
  WorkspaceBase,
  WorkspaceMember,
  WorkspaceRole,
} from "@/features/workspaces/types/workspace.types";

type WorkspacesResponseData = {
  workspaces: Workspace[];
};

type WorkspaceResponseData<TWorkspace> = {
  workspace: TWorkspace;
};

type WorkspaceMembersResponseData = {
  members: WorkspaceMember[];
};

type WorkspaceMemberResponseData = {
  member: WorkspaceMember;
};

export const workspaceService = {
  async getAll() {
    const response =
      await apiClient.get<ApiResponse<WorkspacesResponseData>>("/workspaces");

    return response.data.data.workspaces;
  },

  async create(payload: CreateWorkspacePayload) {
    const response = await apiClient.post<
      ApiResponse<WorkspaceResponseData<Workspace>>
    >("/workspaces", payload);

    return response.data.data.workspace;
  },

  async update(workspaceId: string, payload: UpdateWorkspacePayload) {
    const response = await apiClient.patch<
      ApiResponse<WorkspaceResponseData<WorkspaceBase>>
    >(`/workspaces/${workspaceId}`, payload);

    return response.data.data.workspace;
  },

  async remove(workspaceId: string) {
    await apiClient.delete<ApiResponse<null>>(`/workspaces/${workspaceId}`);
  },

  async getMembers(workspaceId: string) {
    const response = await apiClient.get<
      ApiResponse<WorkspaceMembersResponseData>
    >(`/workspaces/${workspaceId}/members`);

    return response.data.data.members;
  },

  async addMember(workspaceId: string, payload: AddWorkspaceMemberPayload) {
    const response = await apiClient.post<
      ApiResponse<WorkspaceMemberResponseData>
    >(`/workspaces/${workspaceId}/members`, payload);

    return response.data.data.member;
  },

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    role: Exclude<WorkspaceRole, "OWNER">,
  ) {
    const response = await apiClient.patch<
      ApiResponse<WorkspaceMemberResponseData>
    >(`/workspaces/${workspaceId}/members/${memberId}/role`, {
      role,
    });

    return response.data.data.member;
  },

  async removeMember(workspaceId: string, memberId: string) {
    await apiClient.delete<ApiResponse<null>>(
      `/workspaces/${workspaceId}/members/${memberId}`,
    );
  },
};
