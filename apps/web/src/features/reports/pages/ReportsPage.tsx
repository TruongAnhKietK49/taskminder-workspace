import { useState } from "react";
import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { PresenceDot } from "@/features/chat/components/PresenceDot";
import { useRealtimeStore } from "@/features/chat/stores/realtime.store";
import {
  useExportReportCsv,
  useWorkspaceActivityLogsQuery,
  useWorkspaceReportQuery,
} from "@/features/reports/hooks/useReports";
import { useWorkspaceSelection } from "@/features/workspaces/hooks/useWorkspaceSelection";
import { SelectDropdown } from "@/shared/components/SelectDropdown";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

const ENTITY_OPTIONS = [
  { value: "ALL", label: "Tất cả hoạt động" },
  { value: "TASK", label: "Công việc (Tasks)" },
  { value: "PROJECT", label: "Dự án (Projects)" },
  { value: "MEMBER", label: "Thành viên" },
  { value: "INVITATION", label: "Lời mời" },
  { value: "WORKSPACE", label: "Workspace" },
];

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function ReportsPage() {
  const { activeWorkspace, activeWorkspaceId } = useWorkspaceSelection();
  const [entityFilter, setEntityFilter] = useState("ALL");

  const reportQuery = useWorkspaceReportQuery(activeWorkspaceId);
  const logsQuery = useWorkspaceActivityLogsQuery(activeWorkspaceId, {
    entityType: entityFilter,
    limit: 30,
  });
  const exportCsvMutation = useExportReportCsv(activeWorkspaceId);
  const presencesByUserId = useRealtimeStore(
    (state) => state.presencesByUserId,
  );

  if (!activeWorkspace || !activeWorkspaceId) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-950">
          Chưa chọn Workspace
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Vui lòng chọn một workspace để xem báo cáo và nhật ký hoạt động.
        </p>
        <Link
          to={ROUTE_PATHS.WORKSPACES}
          className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Đi tới Workspaces
        </Link>
      </section>
    );
  }

  const report = reportQuery.data;
  const maxWeeklyVal = Math.max(
    1,
    ...(report?.weeklyActivity.map((d) =>
      Math.max(d.tasksCreated, d.tasksCompleted),
    ) ?? [1]),
  );

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-5 py-4 text-white shadow-md shadow-blue-500/15 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-100">
            {activeWorkspace.name} · Analytics &amp; Audit
          </p>
          <h1 className="mt-1 text-xl font-bold md:text-2xl">
            Báo cáo &amp; Thống kê
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-blue-50 md:text-sm">
            Theo dõi tiến độ dự án, tỷ lệ hoàn thành, khối lượng công việc từng
            thành viên và nhật ký hoạt động của toàn workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={exportCsvMutation.isPending}
            onClick={() => exportCsvMutation.mutate()}
            className="rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-xs hover:bg-sky-50 disabled:opacity-50"
          >
            {exportCsvMutation.isPending
              ? "Đang xuất..."
              : "⬇ Xuất báo cáo CSV"}
          </button>
          <button
            type="button"
            onClick={() => {
              void reportQuery.refetch();
              void logsQuery.refetch();
            }}
            className="rounded-xl border border-white/25 bg-white/15 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/25"
          >
            Làm mới
          </button>
        </div>
      </header>

      {reportQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : reportQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {getApiErrorMessage(reportQuery.error, "Không thể tải báo cáo.")}
        </div>
      ) : report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tỷ lệ hoàn thành
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {report.kpis.completionRate}%
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                {report.kpis.completedTasks}/{report.kpis.totalTasks} công việc
                đã xong
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Công việc quá hạn
              </p>
              <p className="mt-2 text-3xl font-bold text-red-600">
                {report.kpis.overdueTasks}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tỷ lệ quá hạn: {report.kpis.overdueRate}% · Sắp hạn:{" "}
                {report.kpis.dueSoonTasks}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Dự án hoạt động
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {report.kpis.activeProjects}/{report.kpis.totalProjects}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Đã hoàn thành: {report.kpis.completedProjects} dự án
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Đang thực hiện
              </p>
              <p className="mt-2 text-3xl font-bold text-blue-600">
                {report.kpis.inProgressTasks}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Chưa gán người làm: {report.kpis.unassignedTasks} task
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-950">
                Tiến độ theo Dự án
              </h2>
              <div className="mt-4 space-y-4">
                {report.projectProgress.length === 0 ? (
                  <p className="text-sm text-slate-400">Chưa có dự án nào.</p>
                ) : (
                  report.projectProgress.map((proj) => (
                    <div key={proj.projectId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <Link
                          to={`${ROUTE_PATHS.TASKS}?projectId=${proj.projectId}`}
                          className="font-semibold text-slate-900 hover:text-blue-600"
                        >
                          {proj.name}
                        </Link>
                        <span className="text-xs text-slate-500">
                          {proj.completedTasks}/{proj.totalTasks} xong (
                          {proj.progressPercent}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${proj.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-950">
                Hoạt động 7 ngày qua
              </h2>
              <div className="mt-4 grid grid-cols-7 items-end gap-2 pt-4">
                {report.weeklyActivity.map((day) => {
                  const createdH = Math.round(
                    (day.tasksCreated / maxWeeklyVal) * 100,
                  );
                  const doneH = Math.round(
                    (day.tasksCompleted / maxWeeklyVal) * 100,
                  );

                  return (
                    <div
                      key={day.date}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className="flex h-28 items-end gap-1">
                        <div
                          title={`Tạo mới: ${day.tasksCreated}`}
                          className="w-3 rounded-t bg-blue-500"
                          style={{ height: `${Math.max(createdH, 6)}%` }}
                        />
                        <div
                          title={`Hoàn thành: ${day.tasksCompleted}`}
                          className="w-3 rounded-t bg-emerald-500"
                          style={{ height: `${Math.max(doneH, 6)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex justify-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                  Tạo mới
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  Hoàn thành
                </span>
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-bold text-slate-950">
                Khối lượng công việc theo Thành viên
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Thành viên</th>
                    <th className="px-4 py-3">Được giao</th>
                    <th className="px-4 py-3">Đang làm</th>
                    <th className="px-4 py-3">Hoàn thành</th>
                    <th className="px-4 py-3">Quá hạn</th>
                    <th className="px-5 py-3">Hiệu suất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.memberWorkload.map((member) => (
                    <tr key={member.userId}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <PresenceDot
                            status={
                              presencesByUserId[member.userId]?.status ??
                              "OFFLINE"
                            }
                          />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {member.fullName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {member.totalAssigned}
                      </td>
                      <td className="px-4 py-3 text-blue-600">
                        {member.inProgress}
                      </td>
                      <td className="px-4 py-3 text-emerald-600">
                        {member.completed}
                      </td>
                      <td className="px-4 py-3 text-red-600">
                        {member.overdue}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${member.completionPercent}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">
                            {member.completionPercent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-950">
              Nhật ký hoạt động Workspace (Audit Log)
            </h2>
            <p className="text-xs text-slate-500">
              Ghi nhận lịch sử thay đổi dự án, công việc và phân quyền thành
              viên.
            </p>
          </div>

          <SelectDropdown
            ariaLabel="Lọc nhật ký hoạt động"
            size="sm"
            align="right"
            value={entityFilter}
            className="w-48"
            onChange={setEntityFilter}
            options={ENTITY_OPTIONS}
          />
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {logsQuery.isLoading ? (
            <p className="py-6 text-center text-xs text-slate-500">
              Đang tải nhật ký...
            </p>
          ) : (logsQuery.data ?? []).length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              Chưa có hoạt động nào được ghi nhận.
            </p>
          ) : (
            (logsQuery.data ?? []).map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {log.entityType}
                    </span>
                    <span className="font-medium text-slate-900">
                      {log.summary}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Thực hiện bởi {log.actor?.fullName ?? "Hệ thống"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">
                  {dateTimeFormatter.format(new Date(log.createdAt))}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
