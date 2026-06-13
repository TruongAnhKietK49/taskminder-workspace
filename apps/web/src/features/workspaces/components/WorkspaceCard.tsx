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
  dateStyle: "medium",
});

const roleClassNames: Record<WorkspaceRole, string> = {
  OWNER: "border-violet-200 bg-violet-50 text-violet-700",
  ADMIN: "border-blue-200 bg-blue-50 text-blue-700",
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
    <article
      className={cn(
        "rounded-2xl border bg-white p-5 shadow-sm transition",
        active
          ? "border-slate-950 ring-2 ring-slate-950/10"
          : "border-slate-200 hover:border-slate-300 hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
          {getWorkspaceInitials(workspace.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="truncate font-semibold text-slate-950">
              {workspace.name}
            </h3>

            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                roleClassNames[workspace.currentUserRole],
              )}
            >
              {WORKSPACE_ROLE_LABELS[workspace.currentUserRole]}
            </span>
          </div>

          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
            {workspace.description || "Workspace chưa có mô tả."}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="text-xs text-slate-500">
          <p>{workspace.memberCount} thành viên</p>

          <p className="mt-1">
            Cập nhật {dateFormatter.format(new Date(workspace.updatedAt))}
          </p>
        </div>

        <button
          type="button"
          onClick={onSelect}
          disabled={active}
          className={cn(
            "rounded-xl px-3 py-2 text-sm font-medium transition",
            active
              ? "cursor-default bg-slate-100 text-slate-500"
              : "bg-slate-950 text-white hover:bg-slate-800",
          )}
        >
          {active ? "Đang sử dụng" : "Chuyển sang"}
        </button>
      </div>
    </article>
  );
}
