import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationQueryKeys } from "@/features/notifications/hooks/useNotifications";
import { projectQueryKeys } from "@/features/projects/hooks/useProjects";
import { workspaceService } from "@/features/workspaces/services/workspace.service";
import { useWorkspaceStore } from "@/features/workspaces/stores/workspace.store";
import type {
  InviteWorkspaceMemberVariables,
  WorkspaceInvitation,
} from "@/features/workspaces/types/workspace.types";
import { workspaceMemberQueryKeys } from "@/features/workspaces/hooks/useWorkspaceMembers";
import { workspaceQueryKeys } from "@/features/workspaces/hooks/useWorkspaces";
import { toast } from "@/shared/stores/toast.store";

const WORKSPACE_INVITATIONS_QUERY_KEY = ["workspace-invitations"] as const;

export const workspaceInvitationQueryKeys = {
  all: WORKSPACE_INVITATIONS_QUERY_KEY,

  myPending: () => [...WORKSPACE_INVITATIONS_QUERY_KEY, "me"] as const,

  list: (workspaceId: string) =>
    [...WORKSPACE_INVITATIONS_QUERY_KEY, workspaceId] as const,
};

export function useMyWorkspaceInvitationsQuery() {
  return useQuery({
    queryKey: workspaceInvitationQueryKeys.myPending(),
    queryFn: workspaceService.getMyInvitations,
    refetchInterval: 30_000,
  });
}

export function useWorkspaceInvitationsQuery(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceId
      ? workspaceInvitationQueryKeys.list(workspaceId)
      : workspaceInvitationQueryKeys.all,

    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required");
      }

      return workspaceService.getInvitations(workspaceId);
    },

    enabled: Boolean(workspaceId),
  });
}

export function useInviteWorkspaceMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, payload }: InviteWorkspaceMemberVariables) =>
      workspaceService.inviteMember(workspaceId, payload),

    onSuccess: (invitation, variables) => {
      queryClient.setQueryData<WorkspaceInvitation[]>(
        workspaceInvitationQueryKeys.list(variables.workspaceId),
        (currentInvitations = []) => [
          invitation,
          ...currentInvitations.filter(
            (currentInvitation) => currentInvitation.id !== invitation.id,
          ),
        ],
      );
      toast.success("Đã gửi lời mời thành viên!");
    },
  });
}

export function useAcceptWorkspaceInvitation() {
  const queryClient = useQueryClient();
  const setActiveWorkspaceId = useWorkspaceStore(
    (state) => state.setActiveWorkspaceId,
  );

  return useMutation({
    mutationFn: workspaceService.acceptInvitation,

    onSuccess: async (member) => {
      if (member.workspaceId) {
        setActiveWorkspaceId(member.workspaceId);
      }

      await queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.list(),
      });

      await queryClient.invalidateQueries({
        queryKey: workspaceMemberQueryKeys.all,
      });

      await queryClient.invalidateQueries({
        queryKey: projectQueryKeys.all,
      });

      await queryClient.invalidateQueries({
        queryKey: workspaceInvitationQueryKeys.all,
      });

      await queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
      toast.success("Đã tham gia workspace!");
    },
  });
}

export function useRejectWorkspaceInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceService.rejectInvitation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workspaceInvitationQueryKeys.all,
      });

      await queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
      toast.info("Đã từ chối lời mời.");
    },
  });
}
