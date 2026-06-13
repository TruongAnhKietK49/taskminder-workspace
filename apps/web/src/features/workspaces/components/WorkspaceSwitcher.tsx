import { useState } from "react";

import { CreateWorkspaceModal } from "@/features/workspaces/components/CreateWorkspaceModal";
import { useWorkspaceSelection } from "@/features/workspaces/hooks/useWorkspaceSelection";
import { cn } from "@/shared/lib/cn";

type WorkspaceSwitcherProps = {
  compact?: boolean;
  className?: string;
};

export function WorkspaceSwitcher({
  compact = false,
  className,
}: WorkspaceSwitcherProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { workspaces, activeWorkspaceId, selectWorkspace, isLoading, isError } =
    useWorkspaceSelection();

  let emptyOptionLabel = "Chưa có workspace";

  if (isLoading) {
    emptyOptionLabel = "Đang tải workspace...";
  }

  if (isError) {
    emptyOptionLabel = "Không thể tải workspace";
  }

  return (
    <>
      <div className={cn("space-y-2", className)}>
        <label
          htmlFor={compact ? "mobile-workspace-switcher" : "workspace-switcher"}
          className={cn(
            "block text-xs font-semibold uppercase tracking-wide text-slate-500",
            compact && "sr-only",
          )}
        >
          Workspace hiện tại
        </label>

        <div
          className={cn(
            "grid gap-2",
            compact && "grid-cols-[minmax(0,1fr)_auto]",
          )}
        >
          <select
            id={compact ? "mobile-workspace-switcher" : "workspace-switcher"}
            value={activeWorkspaceId ?? ""}
            onChange={(event) => {
              selectWorkspace(event.target.value || null);
            }}
            disabled={isLoading || workspaces.length === 0}
            className="min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {workspaces.length === 0 && (
              <option value="">{emptyOptionLabel}</option>
            )}

            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            title="Tạo workspace"
            className={cn(
              "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100",
              !compact && "w-full",
            )}
          >
            {compact ? "+" : "+ Tạo workspace"}
          </button>
        </div>
      </div>

      <CreateWorkspaceModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
