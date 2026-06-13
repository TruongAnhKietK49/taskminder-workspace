import { useEffect } from "react";

import { useWorkspacesQuery } from "@/features/workspaces/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/features/workspaces/stores/workspace.store";
import type { Workspace } from "@/features/workspaces/types/workspace.types";

const EMPTY_WORKSPACES: Workspace[] = [];

export function useWorkspaceSelection() {
  const workspacesQuery = useWorkspacesQuery();

  const persistedActiveWorkspaceId = useWorkspaceStore(
    (state) => state.activeWorkspaceId,
  );

  const setActiveWorkspaceId = useWorkspaceStore(
    (state) => state.setActiveWorkspaceId,
  );

  const workspaces = workspacesQuery.data ?? EMPTY_WORKSPACES;

  const activeWorkspace =
    workspaces.find(
      (workspace) => workspace.id === persistedActiveWorkspaceId,
    ) ??
    workspaces[0] ??
    null;

  const activeWorkspaceId = activeWorkspace?.id ?? null;

  useEffect(() => {
    if (!workspacesQuery.isSuccess) {
      return;
    }

    if (persistedActiveWorkspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(activeWorkspaceId);
    }
  }, [
    activeWorkspaceId,
    persistedActiveWorkspaceId,
    setActiveWorkspaceId,
    workspacesQuery.isSuccess,
  ]);

  return {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    selectWorkspace: setActiveWorkspaceId,

    isLoading: workspacesQuery.isLoading,
    isFetching: workspacesQuery.isFetching,
    isError: workspacesQuery.isError,
    error: workspacesQuery.error,
    refetch: workspacesQuery.refetch,
  };
}
