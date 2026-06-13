import { create } from "zustand";
import { persist } from "zustand/middleware";

type WorkspaceState = {
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (workspaceId: string | null) => void;
  clearActiveWorkspace: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,

      setActiveWorkspaceId: (workspaceId) => {
        set({
          activeWorkspaceId: workspaceId,
        });
      },

      clearActiveWorkspace: () => {
        set({
          activeWorkspaceId: null,
        });
      },
    }),
    {
      name: "taskminder-active-workspace",
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    },
  ),
);
