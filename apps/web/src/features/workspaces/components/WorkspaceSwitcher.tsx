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
  if (isLoading) emptyOptionLabel = "Đang tải...";
  if (isError) emptyOptionLabel = "Lỗi tải workspace";

  return (
    <>
      <div className={cn("space-y-1.5", className)}>
        {!compact ? (
          <label
            htmlFor="workspace-switcher"
            className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400"
          >
            Workspace
          </label>
        ) : null}

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5">
          <select
            id={compact ? "mobile-workspace-switcher" : "workspace-switcher"}
            value={activeWorkspaceId ?? ""}
            onChange={(event) => {
              selectWorkspace(event.target.value || null);
            }}
            disabled={isLoading || workspaces.length === 0}
            className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
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
            title="Tạo workspace mới"
            aria-label="Tạo workspace mới"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sm font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-sky-400"
          >
            +
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
