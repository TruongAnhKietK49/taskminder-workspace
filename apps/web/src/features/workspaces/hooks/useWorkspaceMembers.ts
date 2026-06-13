import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { workspaceService } from "@/features/workspaces/services/workspace.service";
import type {
  AddWorkspaceMemberVariables,
  RemoveWorkspaceMemberVariables,
  UpdateWorkspaceMemberRoleVariables,
  WorkspaceMember,
} from "@/features/workspaces/types/workspace.types";
import { workspaceQueryKeys } from "@/features/workspaces/hooks/useWorkspaces";

const WORKSPACE_MEMBERS_QUERY_KEY = ["workspace-members"] as const;

export const workspaceMemberQueryKeys = {
  all: WORKSPACE_MEMBERS_QUERY_KEY,

  list: (workspaceId: string) =>
    [...WORKSPACE_MEMBERS_QUERY_KEY, workspaceId] as const,
};

export function useWorkspaceMembersQuery(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceId
      ? workspaceMemberQueryKeys.list(workspaceId)
      : workspaceMemberQueryKeys.all,

    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required");
      }

      return workspaceService.getMembers(workspaceId);
    },

    enabled: Boolean(workspaceId),
  });
}

export function useAddWorkspaceMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, payload }: AddWorkspaceMemberVariables) =>
      workspaceService.addMember(workspaceId, payload),

    onSuccess: (member, variables) => {
      queryClient.setQueryData<WorkspaceMember[]>(
        workspaceMemberQueryKeys.list(variables.workspaceId),
        (currentMembers = []) => [...currentMembers, member],
      );

      void queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.list(),
      });
    },
  });
}

export function useUpdateWorkspaceMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      memberId,
      role,
    }: UpdateWorkspaceMemberRoleVariables) =>
      workspaceService.updateMemberRole(workspaceId, memberId, role),

    onSuccess: (updatedMember, variables) => {
      queryClient.setQueryData<WorkspaceMember[]>(
        workspaceMemberQueryKeys.list(variables.workspaceId),
        (currentMembers) =>
          currentMembers?.map((member) =>
            member.id === updatedMember.id ? updatedMember : member,
          ),
      );
    },
  });
}

export function useRemoveWorkspaceMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, memberId }: RemoveWorkspaceMemberVariables) =>
      workspaceService.removeMember(workspaceId, memberId),

    onSuccess: (_, variables) => {
      queryClient.setQueryData<WorkspaceMember[]>(
        workspaceMemberQueryKeys.list(variables.workspaceId),
        (currentMembers) =>
          currentMembers?.filter((member) => member.id !== variables.memberId),
      );

      void queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.list(),
      });
    },
  });
}
