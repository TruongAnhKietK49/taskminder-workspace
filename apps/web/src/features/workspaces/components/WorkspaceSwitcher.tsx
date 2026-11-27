import { useMemo, useState } from "react";

import { CreateWorkspaceModal } from "@/features/workspaces/components/CreateWorkspaceModal";
import { useWorkspaceSelection } from "@/features/workspaces/hooks/useWorkspaceSelection";
import { SelectDropdown } from "@/shared/components/SelectDropdown";
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

  let emptyPlaceholder = "Chưa có workspace";
  if (isLoading) emptyPlaceholder = "Đang tải...";
  if (isError) emptyPlaceholder = "Lỗi tải workspace";

  const workspaceOptions = useMemo(
    () =>
      workspaces.map((ws) => ({
        value: ws.id,
        label: ws.name,
        description: `${ws.memberCount} thành viên`,
        badge: ws.currentUserRole,
      })),
    [workspaces],
  );

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
          <SelectDropdown
            id={compact ? "mobile-workspace-switcher" : "workspace-switcher"}
            ariaLabel="Chọn workspace"
            size="sm"
            value={activeWorkspaceId ?? ""}
            options={workspaceOptions}
            placeholder={emptyPlaceholder}
            disabled={isLoading || workspaces.length === 0}
            onChange={(nextId) => selectWorkspace(nextId || null)}
            menuClassName="w-60"
          />

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
