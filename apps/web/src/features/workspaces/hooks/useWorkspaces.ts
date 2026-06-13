import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { workspaceService } from "@/features/workspaces/services/workspace.service";
import { useWorkspaceStore } from "@/features/workspaces/stores/workspace.store";
import type {
  UpdateWorkspaceVariables,
  Workspace,
} from "@/features/workspaces/types/workspace.types";

const WORKSPACES_QUERY_KEY = ["workspaces"] as const;

export const workspaceQueryKeys = {
  all: WORKSPACES_QUERY_KEY,
  list: () => [...WORKSPACES_QUERY_KEY, "list"] as const,
};

function sortByUpdatedAt(workspaces: Workspace[]) {
  return [...workspaces].sort(
    (firstWorkspace, secondWorkspace) =>
      Date.parse(secondWorkspace.updatedAt) -
      Date.parse(firstWorkspace.updatedAt),
  );
}

export function useWorkspacesQuery() {
  return useQuery({
    queryKey: workspaceQueryKeys.list(),
    queryFn: workspaceService.getAll,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const setActiveWorkspaceId = useWorkspaceStore(
    (state) => state.setActiveWorkspaceId,
  );

  return useMutation({
    mutationFn: workspaceService.create,

    onSuccess: (workspace) => {
      queryClient.setQueryData<Workspace[]>(
        workspaceQueryKeys.list(),
        (currentWorkspaces = []) =>
          sortByUpdatedAt([
            workspace,
            ...currentWorkspaces.filter(
              (currentWorkspace) => currentWorkspace.id !== workspace.id,
            ),
          ]),
      );

      setActiveWorkspaceId(workspace.id);
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, payload }: UpdateWorkspaceVariables) =>
      workspaceService.update(workspaceId, payload),

    onSuccess: (updatedWorkspace) => {
      queryClient.setQueryData<Workspace[]>(
        workspaceQueryKeys.list(),
        (currentWorkspaces) => {
          if (!currentWorkspaces) {
            return currentWorkspaces;
          }

          const nextWorkspaces = currentWorkspaces.map((workspace) => {
            if (workspace.id !== updatedWorkspace.id) {
              return workspace;
            }

            return {
              ...workspace,
              ...updatedWorkspace,
            };
          });

          return sortByUpdatedAt(nextWorkspaces);
        },
      );
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  const setActiveWorkspaceId = useWorkspaceStore(
    (state) => state.setActiveWorkspaceId,
  );

  return useMutation({
    mutationFn: workspaceService.remove,

    onSuccess: (_, removedWorkspaceId) => {
      const currentWorkspaces =
        queryClient.getQueryData<Workspace[]>(workspaceQueryKeys.list()) ?? [];

      const remainingWorkspaces = currentWorkspaces.filter(
        (workspace) => workspace.id !== removedWorkspaceId,
      );

      queryClient.setQueryData(workspaceQueryKeys.list(), remainingWorkspaces);

      const currentActiveWorkspaceId =
        useWorkspaceStore.getState().activeWorkspaceId;

      if (currentActiveWorkspaceId === removedWorkspaceId) {
        setActiveWorkspaceId(remainingWorkspaces[0]?.id ?? null);
      }
    },
  });
}
