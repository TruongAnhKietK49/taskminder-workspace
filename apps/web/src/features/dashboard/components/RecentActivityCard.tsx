import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useWorkspaceActivityLogsQuery } from "@/features/reports/hooks/useReports";

type RecentActivityCardProps = {
  workspaceId: string;
};

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function RecentActivityCard({ workspaceId }: RecentActivityCardProps) {
  const logsQuery = useWorkspaceActivityLogsQuery(workspaceId, { limit: 8 });
  const logs = logsQuery.data ?? [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Audit Trail
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-slate-950">
            Hoạt động gần đây
          </h2>
        </div>

        <Link
          to={ROUTE_PATHS.REPORTS}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Xem báo cáo
        </Link>
      </div>

      {logsQuery.isLoading ? (
        <div className="mt-4 space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="mt-4 py-6 text-center text-xs text-slate-400">
          Chưa có hoạt động nào gần đây.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between gap-3 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">
                  {log.summary}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {log.actor?.fullName ?? "Hệ thống"} · {log.entityType}
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">
                {timeFormatter.format(new Date(log.createdAt))}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
