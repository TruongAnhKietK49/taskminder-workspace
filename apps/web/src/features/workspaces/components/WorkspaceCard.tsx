import { WORKSPACE_ROLE_LABELS } from "@/features/workspaces/constants/workspace.constants";
import type {
  Workspace,
  WorkspaceRole,
} from "@/features/workspaces/types/workspace.types";
import { cn } from "@/shared/lib/cn";

type WorkspaceCardProps = {
  workspace: Workspace;
  active: boolean;
  onSelect: () => void;
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const roleClassNames: Record<WorkspaceRole, string> = {
  OWNER: "border-indigo-200 bg-indigo-50 text-indigo-700",
  ADMIN: "border-sky-200 bg-sky-50 text-blue-700",
  MEMBER: "border-slate-200 bg-slate-100 text-slate-600",
};

function getWorkspaceInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function WorkspaceCard({
  workspace,
  active,
  onSelect,
}: WorkspaceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border p-3.5 text-left transition",
        active
          ? "border-sky-400 bg-sky-50/70 ring-2 ring-sky-200 dark:border-sky-500/60 dark:bg-sky-950/30 dark:ring-sky-500/20"
          : "border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-xs",
            active
              ? "bg-gradient-to-br from-blue-600 to-sky-500"
              : "bg-slate-800 dark:bg-slate-700",
          )}
        >
          {getWorkspaceInitials(workspace.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-bold text-slate-950 dark:text-white">
              {workspace.name}
            </h3>

            {active ? (
              <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                Đang chọn
              </span>
            ) : null}
          </div>

          <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
            {workspace.description || "Workspace chưa có mô tả."}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                  roleClassNames[workspace.currentUserRole],
                )}
              >
                {WORKSPACE_ROLE_LABELS[workspace.currentUserRole]}
              </span>
              <span>{workspace.memberCount} thành viên</span>
            </div>

            <span>{dateFormatter.format(new Date(workspace.updatedAt))}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
