import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import {
  TASK_PRIORITY_BADGE_CLASSES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/features/tasks/constants/task.constants";
import type { WorkspaceTask } from "@/features/tasks/types/task.types";
import {
  formatShortDate,
  getDueDateStatus,
  getInitials,
} from "@/features/tasks/utils/task-helpers";

type UpcomingDeadlinesCardProps = {
  tasks: WorkspaceTask[];
  isLoading: boolean;
};

export function UpcomingDeadlinesCard({
  tasks,
  isLoading,
}: UpcomingDeadlinesCardProps) {
  const deadlineTasks = tasks
    .filter(
      (task) =>
        task.dueDate !== null &&
        task.status !== "DONE" &&
        task.status !== "ARCHIVED",
    )
    .sort(
      (firstTask, secondTask) =>
        Date.parse(firstTask.dueDate as string) -
        Date.parse(secondTask.dueDate as string),
    )
    .slice(0, 6);

  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Schedule
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-slate-950">
            Upcoming &amp; overdue deadlines
          </h2>
        </div>

        <Link
          to={ROUTE_PATHS.TASKS}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          View all
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-14 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : deadlineTasks.length === 0 ? (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No upcoming deadlines
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Active tasks with due dates will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {deadlineTasks.map((task) => {
            const dueStatus = getDueDateStatus(task.dueDate, task.status);

            return (
              <Link
                key={task.id}
                to={`${ROUTE_PATHS.TASKS}?projectId=${task.projectId}`}
                className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50/70"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {task.title}
                    </p>
                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {task.project.name}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span
                      className={[
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                        TASK_PRIORITY_BADGE_CLASSES[task.priority],
                      ].join(" ")}
                    >
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </span>
                    <span>{TASK_STATUS_LABELS[task.status]}</span>
                    <span>·</span>
                    {task.assignee ? (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700">
                          {getInitials(task.assignee.fullName)}
                        </span>
                        {task.assignee.fullName}
                      </span>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </div>
                </div>

                {task.dueDate ? (
                  <span
                    className={[
                      "shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold",
                      dueStatus === "overdue"
                        ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                        : dueStatus === "soon"
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          : "bg-slate-100 text-slate-600",
                    ].join(" ")}
                  >
                    {dueStatus === "overdue" ? "Overdue · " : ""}
                    {formatShortDate(task.dueDate)}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
