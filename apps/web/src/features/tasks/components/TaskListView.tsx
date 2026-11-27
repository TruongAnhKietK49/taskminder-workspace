import {
  TASK_PRIORITY_BADGE_CLASSES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_BADGE_CLASSES,
  TASK_STATUS_LABELS,
  TASK_STATUS_OPTIONS,
} from "@/features/tasks/constants/task.constants";
import type { TaskStatus, WorkspaceTask } from "@/features/tasks/types/task.types";
import {
  formatShortDate,
  getDueDateStatus,
  getInitials,
} from "@/features/tasks/utils/task-helpers";

type TaskListViewProps = {
  tasks: WorkspaceTask[];
  updatingTaskId: string | null;
  canEditTask: (task: WorkspaceTask) => boolean;
  onOpenDetail: (task: WorkspaceTask) => void;
  onStatusChange: (task: WorkspaceTask, status: TaskStatus) => void;
  onEdit: (task: WorkspaceTask) => void;
  onArchive: (task: WorkspaceTask) => void;
};

export function TaskListView({
  tasks,
  updatingTaskId,
  canEditTask,
  onOpenDetail,
  onStatusChange,
  onEdit,
  onArchive,
}: TaskListViewProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3.5">Task</th>
            <th className="px-4 py-3.5">Project</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5">Priority</th>
            <th className="px-4 py-3.5">Assignee</th>
            <th className="px-4 py-3.5">Due date</th>
            <th className="px-4 py-3.5 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => {
            const canEdit = canEditTask(task);
            const isUpdating = updatingTaskId === task.id;
            const isArchived = task.status === "ARCHIVED";
            const dueStatus = getDueDateStatus(task.dueDate, task.status);

            return (
              <tr
                key={task.id}
                className={[
                  "transition hover:bg-slate-50/80",
                  isUpdating ? "opacity-60" : "",
                ].join(" ")}
              >
                <td className="max-w-xs px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(task)}
                    className="text-left font-semibold text-slate-950 hover:text-blue-600"
                  >
                    {task.title}
                  </button>
                  {task.description ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                      {task.description}
                    </p>
                  ) : null}
                  {(task.commentCount ?? 0) > 0 ||
                  (task.attachmentCount ?? 0) > 0 ? (
                    <div className="mt-1 flex items-center gap-2.5 text-[11px] text-slate-400">
                      {(task.commentCount ?? 0) > 0 ? (
                        <span>💬 {task.commentCount}</span>
                      ) : null}
                      {(task.attachmentCount ?? 0) > 0 ? (
                        <span>📎 {task.attachmentCount}</span>
                      ) : null}
                    </div>
                  ) : null}
                </td>

                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {task.project.name}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-3.5">
                  {canEdit ? (
                    <select
                      aria-label={`Change status for ${task.title}`}
                      value={task.status}
                      disabled={isUpdating}
                      onChange={(event) =>
                        onStatusChange(task, event.target.value as TaskStatus)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
                    >
                      {TASK_STATUS_OPTIONS.filter(
                        (opt) => opt.value !== "ARCHIVED" || isArchived,
                      ).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                        TASK_STATUS_BADGE_CLASSES[task.status],
                      ].join(" ")}
                    >
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-3.5">
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                      TASK_PRIORITY_BADGE_CLASSES[task.priority],
                    ].join(" ")}
                  >
                    {TASK_PRIORITY_LABELS[task.priority]}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-3.5">
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                        {getInitials(task.assignee.fullName)}
                      </span>
                      <span className="text-xs font-medium text-slate-700">
                        {task.assignee.fullName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Unassigned</span>
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-3.5 text-xs">
                  {task.dueDate ? (
                    <span
                      className={[
                        "rounded-md px-2 py-0.5 font-medium",
                        dueStatus === "overdue"
                          ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                          : dueStatus === "soon"
                            ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                            : "text-slate-600",
                      ].join(" ")}
                    >
                      {dueStatus === "overdue" ? "Overdue · " : ""}
                      {formatShortDate(task.dueDate)}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-3.5 text-right">
                  {canEdit ? (
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => onEdit(task)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Edit
                      </button>

                      {!isArchived ? (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => onArchive(task)}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Archive
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">View only</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
