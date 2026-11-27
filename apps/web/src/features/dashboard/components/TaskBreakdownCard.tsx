import {
  BOARD_TASK_STATUSES,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/features/tasks/constants/task.constants";
import type { WorkspaceTaskSummary } from "@/features/tasks/types/task.types";

type TaskBreakdownCardProps = {
  summary: WorkspaceTaskSummary | undefined;
  isLoading: boolean;
};

export function TaskBreakdownCard({
  summary,
  isLoading,
}: TaskBreakdownCardProps) {
  const totalActive = summary?.totalActive ?? 0;
  const doneCount = summary?.byStatus.DONE ?? 0;
  const completionPercent =
    totalActive > 0 ? Math.round((doneCount / totalActive) * 100) : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Analytics
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-slate-950">
            Task progress
          </h2>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          {completionPercent}% completed
        </span>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {[0, 1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-7 animate-pulse rounded-lg bg-slate-100"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-5 space-y-3.5">
            {BOARD_TASK_STATUSES.map((status) => {
              const meta = TASK_STATUS_OPTIONS.find(
                (option) => option.value === status,
              );
              const count = summary?.byStatus[status] ?? 0;
              const percent =
                totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;

              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2 text-slate-700">
                      <span
                        className={[
                          "h-2.5 w-2.5 rounded-full",
                          meta?.dotClass ?? "bg-slate-400",
                        ].join(" ")}
                      />
                      <span>{meta?.label ?? status}</span>
                    </div>

                    <span className="text-slate-500">
                      <strong className="font-semibold text-slate-900">
                        {count}
                      </strong>{" "}
                      ({percent}%)
                    </span>
                  </div>

                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={[
                        "h-full rounded-full transition-all",
                        meta?.dotClass ?? "bg-slate-400",
                      ].join(" ")}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Priority distribution
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {TASK_PRIORITY_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                >
                  <span
                    className={[
                      "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                      option.badgeClass,
                    ].join(" ")}
                  >
                    {option.label}
                  </span>
                  <p className="mt-1.5 text-lg font-bold text-slate-950">
                    {summary?.byPriority[option.value] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
