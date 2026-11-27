import { useMemo } from "react";
import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { RecentActivityCard } from "@/features/dashboard/components/RecentActivityCard";
import { SystemHealthCard } from "@/features/dashboard/components/SystemHealthCard";
import { TaskBreakdownCard } from "@/features/dashboard/components/TaskBreakdownCard";
import { UpcomingDeadlinesCard } from "@/features/dashboard/components/UpcomingDeadlinesCard";
import {
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_LABELS,
} from "@/features/projects/constants/project.constants";
import { useProjectsQuery } from "@/features/projects/hooks/useProjects";
import {
  useWorkspaceTaskSummaryQuery,
  useWorkspaceTasksQuery,
} from "@/features/tasks/hooks/useTasks";
import type { TaskQueryParams } from "@/features/tasks/types/task.types";
import { useWorkspaceSelection } from "@/features/workspaces/hooks/useWorkspaceSelection";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

const DASHBOARD_TASK_QUERY: TaskQueryParams = {
  sortBy: "dueDate",
  sortOrder: "asc",
};

export function DashboardPage() {
  const {
    activeWorkspace,
    activeWorkspaceId,
    isLoading: isLoadingWorkspace,
    isError: isWorkspaceError,
    error: workspaceError,
    refetch: refetchWorkspaces,
  } = useWorkspaceSelection();

  const currentUser = useAuthStore((state) => state.user);

  const projectsQuery = useProjectsQuery(activeWorkspaceId);
  const summaryQuery = useWorkspaceTaskSummaryQuery(activeWorkspaceId);
  const tasksQuery = useWorkspaceTasksQuery(
    activeWorkspaceId,
    DASHBOARD_TASK_QUERY,
  );

  const projects = useMemo(
    () => projectsQuery.data ?? [],
    [projectsQuery.data],
  );
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const summary = summaryQuery.data;

  const activeProjectsCount = useMemo(
    () => projects.filter((project) => project.status === "ACTIVE").length,
    [projects],
  );

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort(
          (firstProject, secondProject) =>
            Date.parse(secondProject.updatedAt) -
            Date.parse(firstProject.updatedAt),
        )
        .slice(0, 5),
    [projects],
  );

  const totalActiveTasks = summary?.totalActive ?? 0;
  const doneCount = summary?.byStatus.DONE ?? 0;
  const completionPercent =
    totalActiveTasks > 0 ? Math.round((doneCount / totalActiveTasks) * 100) : 0;
  const overdueCount = summary?.overdue ?? 0;
  const dueSoonCount = summary?.dueSoon ?? 0;

  if (isLoadingWorkspace) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
        <SystemHealthCard />
      </div>
    );
  }

  if (isWorkspaceError) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800">
            Không thể tải workspace
          </h2>
          <p className="mt-2 text-sm text-red-700">
            {getApiErrorMessage(workspaceError)}
          </p>
          <button
            type="button"
            onClick={() => void refetchWorkspaces()}
            className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Thử lại
          </button>
        </section>

        <SystemHealthCard />
      </div>
    );
  }

  if (!activeWorkspace || !activeWorkspaceId) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            Chưa có workspace nào
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Tạo hoặc tham gia một workspace để bắt đầu quản lý project, phân
            công task và theo dõi tiến độ nhóm.
          </p>
          <Link
            to={ROUTE_PATHS.WORKSPACES}
            className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go to Workspaces
          </Link>
        </section>

        <SystemHealthCard />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-5 py-4 text-white shadow-md shadow-blue-500/15 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-100">
            {activeWorkspace.name} · {activeWorkspace.currentUserRole}
          </p>
          <h1 className="mt-1 text-xl font-bold md:text-2xl">
            Xin chào, {currentUser?.fullName ?? "Developer"}
          </h1>
          <p className="mt-1 text-xs text-blue-50 md:text-sm">
            {activeProjectsCount} dự án hoạt động ·{" "}
            {activeWorkspace.memberCount} thành viên · {totalActiveTasks} công
            việc đang theo dõi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={ROUTE_PATHS.TASKS}
            className="inline-flex items-center justify-center rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-xs hover:bg-sky-50"
          >
            Mở Task Board
          </Link>
          <Link
            to={ROUTE_PATHS.PROJECTS}
            className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/15 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/25"
          >
            Quản lý Projects
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          to={ROUTE_PATHS.PROJECTS}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
        >
          <p className="text-sm font-medium text-slate-500">Projects</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {projects.length}
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-600">
            {activeProjectsCount} active
          </p>
        </Link>

        <Link
          to={ROUTE_PATHS.TASKS}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
        >
          <p className="text-sm font-medium text-slate-500">Active Tasks</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {totalActiveTasks}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {doneCount} completed ({completionPercent}%)
          </p>
        </Link>

        <Link
          to={ROUTE_PATHS.TASKS}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
        >
          <p className="text-sm font-medium text-slate-500">Assigned to Me</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {summary?.assignedToMe ?? 0}
          </p>
          <p className="mt-1 text-xs font-medium text-blue-600">
            Open tasks in your queue
          </p>
        </Link>

        <Link
          to={ROUTE_PATHS.TASKS}
          className={[
            "rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
            overdueCount > 0
              ? "border-red-200 bg-red-50/70"
              : dueSoonCount > 0
                ? "border-amber-200 bg-amber-50/70"
                : "border-emerald-200 bg-emerald-50/50",
          ].join(" ")}
        >
          <p className="text-sm font-medium text-slate-500">
            Deadlines &amp; Risk
          </p>
          <p
            className={[
              "mt-2 text-3xl font-bold",
              overdueCount > 0
                ? "text-red-700"
                : dueSoonCount > 0
                  ? "text-amber-700"
                  : "text-emerald-700",
            ].join(" ")}
          >
            {overdueCount > 0
              ? overdueCount
              : dueSoonCount > 0
                ? dueSoonCount
                : 0}
          </p>
          <p
            className={[
              "mt-1 text-xs font-semibold",
              overdueCount > 0
                ? "text-red-600"
                : dueSoonCount > 0
                  ? "text-amber-600"
                  : "text-emerald-600",
            ].join(" ")}
          >
            {overdueCount > 0
              ? `overdue · ${dueSoonCount} due in 7d`
              : dueSoonCount > 0
                ? "due within 7 days"
                : "All deadlines on track"}
          </p>
        </Link>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <TaskBreakdownCard
          summary={summary}
          isLoading={summaryQuery.isLoading}
        />

        <UpcomingDeadlinesCard
          tasks={tasks}
          isLoading={tasksQuery.isLoading}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Workspace
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-slate-950">
              Recent projects
            </h2>
          </div>

          <Link
            to={ROUTE_PATHS.PROJECTS}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            All projects
          </Link>
        </div>

        {projectsQuery.isLoading ? (
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Chưa có project nào
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Tạo project đầu tiên để bắt đầu quản lý công việc cho nhóm.
            </p>
            <Link
              to={ROUTE_PATHS.PROJECTS}
              className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Create project
            </Link>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {project.name}
                    </p>
                    <span
                      className={[
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
                        PROJECT_STATUS_BADGE_CLASSES[project.status],
                      ].join(" ")}
                    >
                      {PROJECT_STATUS_LABELS[project.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {project.description || "Chưa có mô tả."} ·{" "}
                    {project.memberCount} members
                  </p>
                </div>

                <Link
                  to={`${ROUTE_PATHS.TASKS}?projectId=${project.id}`}
                  className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  Open tasks
                </Link>
              </div>
            ))}
          </div>
        )}
        </section>

        <RecentActivityCard workspaceId={activeWorkspaceId} />
      </div>

      <SystemHealthCard />
    </div>
  );
}
