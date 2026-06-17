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
  InviteWorkspaceMemberPayload,
  WorkspaceInvitation,
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

type WorkspaceInvitationsResponseData = {
  invitations: WorkspaceInvitation[];
};

type WorkspaceInvitationResponseData = {
  invitation: WorkspaceInvitation;
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

  async getInvitations(workspaceId: string) {
    const response = await apiClient.get<
      ApiResponse<WorkspaceInvitationsResponseData>
    >(`/workspaces/${workspaceId}/invitations`);

    return response.data.data.invitations;
  },

  async inviteMember(
    workspaceId: string,
    payload: InviteWorkspaceMemberPayload,
  ) {
    const response = await apiClient.post<
      ApiResponse<WorkspaceInvitationResponseData>
    >(`/workspaces/${workspaceId}/invitations`, payload);

    return response.data.data.invitation;
  },

  async acceptInvitation(token: string) {
    const response = await apiClient.post<
      ApiResponse<WorkspaceMemberResponseData>
    >(`/workspace-invitations/${token}/accept`);

    return response.data.data.member;
  },

  async rejectInvitation(token: string) {
    const response = await apiClient.post<
      ApiResponse<WorkspaceInvitationResponseData>
    >(`/workspace-invitations/${token}/reject`);

    return response.data.data.invitation;
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
