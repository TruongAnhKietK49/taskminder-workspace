import {
  TASK_PRIORITY_BADGE_CLASSES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_OPTIONS,
} from "@/features/tasks/constants/task.constants";
import type { TaskStatus, WorkspaceTask } from "@/features/tasks/types/task.types";
import {
  formatShortDate,
  getDueDateStatus,
  getInitials,
} from "@/features/tasks/utils/task-helpers";

type TaskCardProps = {
  task: WorkspaceTask;
  showProjectBadge: boolean;
  canEdit: boolean;
  isUpdating: boolean;
  onOpenDetail: (task: WorkspaceTask) => void;
  onStatusChange: (task: WorkspaceTask, status: TaskStatus) => void;
  onEdit: (task: WorkspaceTask) => void;
  onArchive: (task: WorkspaceTask) => void;
};

const DUE_BADGE_CLASSES: Record<"overdue" | "soon" | "normal", string> = {
  overdue: "bg-red-50 text-red-700 ring-1 ring-red-200",
  soon: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  normal: "bg-slate-100 text-slate-600",
};

export function TaskCard({
  task,
  showProjectBadge,
  canEdit,
  isUpdating,
  onOpenDetail,
  onStatusChange,
  onEdit,
  onArchive,
}: TaskCardProps) {
  const dueStatus = getDueDateStatus(task.dueDate, task.status);
  const isArchived = task.status === "ARCHIVED";

  return (
    <article
      draggable={canEdit && !isUpdating}
      onDragStart={(event) => {
        if (!canEdit) {
          return;
        }
        event.dataTransfer.setData("text/plain", task.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className={[
        "rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition",
        canEdit
          ? "cursor-grab hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:cursor-grabbing"
          : "",
        isUpdating ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={[
            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
            TASK_PRIORITY_BADGE_CLASSES[task.priority],
          ].join(" ")}
        >
          {TASK_PRIORITY_LABELS[task.priority]}
        </span>

        {showProjectBadge ? (
          <span className="max-w-[140px] truncate rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {task.project.name}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onOpenDetail(task)}
        className="mt-2.5 block w-full text-left"
      >
        <h4 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950 hover:text-blue-600">
          {task.title}
        </h4>
      </button>

      {task.description ? (
        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
          {task.description}
        </p>
      ) : null}

      {(task.commentCount ?? 0) > 0 || (task.attachmentCount ?? 0) > 0 ? (
        <div className="mt-2.5 flex items-center gap-3 text-[11px] font-medium text-slate-500">
          {(task.commentCount ?? 0) > 0 ? (
            <span>💬 {task.commentCount}</span>
          ) : null}
          {(task.attachmentCount ?? 0) > 0 ? (
            <span>📎 {task.attachmentCount}</span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        {task.assignee ? (
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
              {getInitials(task.assignee.fullName)}
            </span>
            <span className="truncate font-medium text-slate-700">
              {task.assignee.fullName}
            </span>
          </div>
        ) : (
          <span className="text-slate-400">Unassigned</span>
        )}

        {task.dueDate && dueStatus !== "none" ? (
          <span
            className={[
              "rounded-md px-2 py-0.5 text-[11px] font-medium",
              DUE_BADGE_CLASSES[dueStatus],
            ].join(" ")}
          >
            {dueStatus === "overdue" ? "Overdue · " : ""}
            {formatShortDate(task.dueDate)}
          </span>
        ) : task.dueDate ? (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {formatShortDate(task.dueDate)}
          </span>
        ) : null}
      </div>

      {canEdit ? (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
          <select
            aria-label={`Change status for ${task.title}`}
            value={task.status}
            disabled={isUpdating}
            onChange={(event) =>
              onStatusChange(task, event.target.value as TaskStatus)
            }
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            {TASK_STATUS_OPTIONS.filter(
              (opt) => opt.value !== "ARCHIVED" || isArchived,
            ).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onEdit(task)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Edit
            </button>

            {!isArchived ? (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onArchive(task)}
                className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Archive
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
