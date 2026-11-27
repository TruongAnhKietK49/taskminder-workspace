import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useProjectsQuery } from "@/features/projects/hooks/useProjects";
import { TaskBoardView } from "@/features/tasks/components/TaskBoardView";
import { TaskDetailDrawer } from "@/features/tasks/components/TaskDetailDrawer";
import { TaskFormModal } from "@/features/tasks/components/TaskFormModal";
import { TaskListView } from "@/features/tasks/components/TaskListView";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_SORT_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/features/tasks/constants/task.constants";
import {
  useArchiveTask,
  useCreateTask,
  useUpdateTask,
  useWorkspaceTaskSummaryQuery,
  useWorkspaceTasksQuery,
} from "@/features/tasks/hooks/useTasks";
import type {
  ActiveTaskStatus,
  CreateTaskPayload,
  TaskPriority,
  TaskQueryParams,
  TaskSortField,
  TaskSortOrder,
  TaskStatus,
  UpdateTaskPayload,
  WorkspaceTask,
} from "@/features/tasks/types/task.types";
import { canUserEditTask } from "@/features/tasks/utils/task-helpers";
import { useWorkspaceSelection } from "@/features/workspaces/hooks/useWorkspaceSelection";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

type ViewMode = "board" | "list";

export function TasksPage() {
  const {
    activeWorkspace,
    activeWorkspaceId,
    isLoading: isLoadingWorkspace,
    isError: isWorkspaceError,
    error: workspaceError,
    refetch: refetchWorkspaces,
  } = useWorkspaceSelection();

  const currentUser = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();

  const projectFilter = searchParams.get("projectId") ?? "";

  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | TaskStatus>("");
  const [priorityFilter, setPriorityFilter] = useState<"" | TaskPriority>("");
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sortOptionValue, setSortOptionValue] = useState("dueDate:asc");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkspaceTask | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [defaultModalStatus, setDefaultModalStatus] =
    useState<ActiveTaskStatus>("TODO");
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const selectedSort = useMemo(() => {
    return (
      TASK_SORT_OPTIONS.find((option) => option.value === sortOptionValue) ??
      TASK_SORT_OPTIONS[0]
    );
  }, [sortOptionValue]);

  const queryParams = useMemo<TaskQueryParams>(() => {
    return {
      projectId: projectFilter || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      assignedToMe: assignedToMeOnly || undefined,
      unassigned: unassignedOnly || undefined,
      includeArchived:
        includeArchived || statusFilter === "ARCHIVED" || undefined,
      search: debouncedSearch || undefined,
      sortBy: selectedSort.sortBy as TaskSortField,
      sortOrder: selectedSort.sortOrder as TaskSortOrder,
    };
  }, [
    assignedToMeOnly,
    debouncedSearch,
    includeArchived,
    priorityFilter,
    projectFilter,
    selectedSort.sortBy,
    selectedSort.sortOrder,
    statusFilter,
    unassignedOnly,
  ]);

  const projectsQuery = useProjectsQuery(activeWorkspaceId);
  const tasksQuery = useWorkspaceTasksQuery(activeWorkspaceId, queryParams);
  const summaryQuery = useWorkspaceTaskSummaryQuery(activeWorkspaceId);

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const archiveTaskMutation = useArchiveTask();

  const projects = useMemo(
    () => projectsQuery.data ?? [],
    [projectsQuery.data],
  );
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const summary = summaryQuery.data;
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  const canAssignOthers =
    activeWorkspace?.currentUserRole === "OWNER" ||
    activeWorkspace?.currentUserRole === "ADMIN";

  const hasProjects = projects.length > 0;
  const isSubmittingModal =
    createTaskMutation.isPending || updateTaskMutation.isPending;

  const hasActiveFilters = Boolean(
    projectFilter ||
      statusFilter ||
      priorityFilter ||
      assignedToMeOnly ||
      unassignedOnly ||
      includeArchived ||
      debouncedSearch,
  );

  function handleProjectFilterChange(nextProjectId: string) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextProjectId) {
      nextParams.set("projectId", nextProjectId);
    } else {
      nextParams.delete("projectId");
    }
    setSearchParams(nextParams, { replace: true });
  }

  function handleResetFilters() {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setAssignedToMeOnly(false);
    setUnassignedOnly(false);
    setIncludeArchived(false);
    setSortOptionValue("dueDate:asc");
    if (projectFilter) {
      handleProjectFilterChange("");
    }
  }

  function handleOpenCreateModal(initialStatus: ActiveTaskStatus = "TODO") {
    setEditingTask(null);
    setDefaultModalStatus(initialStatus);
    setModalError(null);
    setIsFormOpen(true);
  }

  function handleOpenEditModal(task: WorkspaceTask) {
    setEditingTask(task);
    setModalError(null);
    setIsFormOpen(true);
  }

  function handleCloseModal() {
    if (isSubmittingModal) {
      return;
    }
    setIsFormOpen(false);
    setEditingTask(null);
    setModalError(null);
  }

  function handleModalSubmit(
    projectId: string,
    payload: CreateTaskPayload | UpdateTaskPayload,
  ) {
    if (!activeWorkspaceId) {
      return;
    }

    setModalError(null);

    if (editingTask) {
      updateTaskMutation.mutate(
        {
          workspaceId: activeWorkspaceId,
          projectId: editingTask.projectId,
          taskId: editingTask.id,
          payload: payload as UpdateTaskPayload,
        },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingTask(null);
          },
          onError: (error) => {
            setModalError(getApiErrorMessage(error));
          },
        },
      );
      return;
    }

    createTaskMutation.mutate(
      {
        workspaceId: activeWorkspaceId,
        projectId,
        payload: payload as CreateTaskPayload,
      },
      {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingTask(null);
        },
        onError: (error) => {
          setModalError(getApiErrorMessage(error));
        },
      },
    );
  }

  function handleQuickStatusChange(task: WorkspaceTask, status: TaskStatus) {
    if (!activeWorkspaceId || task.status === status) {
      return;
    }

    setActionError(null);
    setUpdatingTaskId(task.id);

    updateTaskMutation.mutate(
      {
        workspaceId: activeWorkspaceId,
        projectId: task.projectId,
        taskId: task.id,
        payload: { status },
      },
      {
        onSettled: () => {
          setUpdatingTaskId(null);
        },
        onError: (error) => {
          setActionError(getApiErrorMessage(error));
        },
      },
    );
  }

  function handleArchiveTask(task: WorkspaceTask) {
    if (!activeWorkspaceId) {
      return;
    }

    const confirmed = window.confirm(
      `Archive task "${task.title}"? Task sẽ được chuyển vào mục Archived.`,
    );

    if (!confirmed) {
      return;
    }

    setActionError(null);
    setUpdatingTaskId(task.id);

    archiveTaskMutation.mutate(
      {
        workspaceId: activeWorkspaceId,
        projectId: task.projectId,
        taskId: task.id,
      },
      {
        onSettled: () => {
          setUpdatingTaskId(null);
        },
        onError: (error) => {
          setActionError(getApiErrorMessage(error));
        },
      },
    );
  }

  if (isLoadingWorkspace) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isWorkspaceError) {
    return (
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
    );
  }

  if (!activeWorkspace || !activeWorkspaceId) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <h2 className="text-lg font-semibold text-slate-950">
          Chưa có workspace
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Bạn cần tạo hoặc chọn workspace trước khi quản lý task.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-950 to-slate-800 p-6 text-white shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-blue-200">
              {activeWorkspace.name}
            </p>

            <h1 className="mt-2 text-2xl font-bold md:text-3xl">
              Task management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Theo dõi tiến độ công việc theo Kanban Board hoặc danh sách, lọc
              nhanh theo project, độ ưu tiên, hạn hoàn thành và người phụ trách.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl bg-white/10 p-1">
              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  viewMode === "board"
                    ? "bg-white text-slate-950"
                    : "text-slate-200 hover:text-white",
                ].join(" ")}
              >
                Board
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  viewMode === "list"
                    ? "bg-white text-slate-950"
                    : "text-slate-200 hover:text-white",
                ].join(" ")}
              >
                List
              </button>
            </div>

            {hasProjects ? (
              <button
                type="button"
                onClick={() => handleOpenCreateModal("TODO")}
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-blue-50"
              >
                + Create task
              </button>
            ) : null}
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Active tasks</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {summary?.totalActive ?? 0}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setAssignedToMeOnly((prev) => !prev);
              setUnassignedOnly(false);
            }}
            className={[
              "rounded-2xl border p-4 text-left shadow-sm transition",
              assignedToMeOnly
                ? "border-blue-300 bg-blue-50 ring-4 ring-blue-100"
                : "border-slate-200 bg-white hover:bg-slate-50",
            ].join(" ")}
          >
            <p className="text-sm font-medium text-slate-500">Assigned to me</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {summary?.assignedToMe ?? 0}
            </p>
          </button>

          <div
            className={[
              "rounded-2xl border p-4 shadow-sm",
              (summary?.overdue ?? 0) > 0
                ? "border-red-200 bg-red-50/60"
                : "border-slate-200 bg-white",
            ].join(" ")}
          >
            <p className="text-sm font-medium text-slate-500">Overdue</p>
            <p
              className={[
                "mt-2 text-2xl font-bold",
                (summary?.overdue ?? 0) > 0
                  ? "text-red-700"
                  : "text-slate-950",
              ].join(" ")}
            >
              {summary?.overdue ?? 0}
            </p>
          </div>

          <div
            className={[
              "rounded-2xl border p-4 shadow-sm",
              (summary?.dueSoon ?? 0) > 0
                ? "border-amber-200 bg-amber-50/60"
                : "border-slate-200 bg-white",
            ].join(" ")}
          >
            <p className="text-sm font-medium text-slate-500">
              Due within 7 days
            </p>
            <p
              className={[
                "mt-2 text-2xl font-bold",
                (summary?.dueSoon ?? 0) > 0
                  ? "text-amber-700"
                  : "text-slate-950",
              ].join(" ")}
            >
              {summary?.dueSoon ?? 0}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search task title or description..."
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <select
              aria-label="Filter by project"
              value={projectFilter}
              onChange={(event) =>
                handleProjectFilterChange(event.target.value)
              }
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "" | TaskStatus)
              }
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All active statuses</option>
              {TASK_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value as "" | TaskPriority)
              }
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All priorities</option>
              {TASK_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort tasks"
              value={sortOptionValue}
              onChange={(event) => setSortOptionValue(event.target.value)}
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {TASK_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAssignedToMeOnly((prev) => !prev);
                  setUnassignedOnly(false);
                }}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-semibold transition",
                  assignedToMeOnly
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                Assigned to me
              </button>

              <button
                type="button"
                onClick={() => {
                  setUnassignedOnly((prev) => !prev);
                  setAssignedToMeOnly(false);
                }}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-semibold transition",
                  unassignedOnly
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                Unassigned
              </button>

              <button
                type="button"
                onClick={() => setIncludeArchived((prev) => !prev)}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-semibold transition",
                  includeArchived
                    ? "border-zinc-400 bg-zinc-100 text-zinc-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                Show archived
              </button>
            </div>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Reset filters
              </button>
            ) : null}
          </div>
        </section>

        {actionError ? (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="font-semibold text-red-800 hover:underline"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {tasksQuery.isLoading || projectsQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[0, 1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : null}

        {tasksQuery.isError ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-800">
              Không thể tải danh sách task
            </h2>
            <p className="mt-2 text-sm text-red-700">
              {getApiErrorMessage(tasksQuery.error)}
            </p>
            <button
              type="button"
              onClick={() => void tasksQuery.refetch()}
              className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Thử lại
            </button>
          </section>
        ) : null}

        {!tasksQuery.isLoading && !projectsQuery.isLoading && !tasksQuery.isError ? (
          !hasProjects ? (
            <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-lg font-semibold text-slate-950">
                Chưa có project nào trong workspace
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Task thuộc về từng project. Hãy tạo hoặc tham gia ít nhất một
                project trước khi tạo công việc.
              </p>
              <Link
                to={ROUTE_PATHS.PROJECTS}
                className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Go to Projects
              </Link>
            </section>
          ) : tasks.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-lg font-semibold text-slate-950">
                {hasActiveFilters
                  ? "Không tìm thấy task phù hợp"
                  : "Chưa có task nào"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {hasActiveFilters
                  ? "Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc hiện tại."
                  : "Tạo task đầu tiên để bắt đầu phân công và theo dõi tiến độ."}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Reset filters
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal("TODO")}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  + Create task
                </button>
              </div>
            </section>
          ) : viewMode === "board" ? (
            <TaskBoardView
              tasks={tasks}
              showProjectBadge={!projectFilter}
              updatingTaskId={updatingTaskId}
              canEditTask={(task) =>
                canUserEditTask(
                  task,
                  currentUser?.id,
                  activeWorkspace.currentUserRole,
                )
              }
              canCreateTask={hasProjects}
              onOpenDetail={(task) => setSelectedTaskId(task.id)}
              onStatusChange={handleQuickStatusChange}
              onQuickCreate={(status) => handleOpenCreateModal(status)}
              onEdit={handleOpenEditModal}
              onArchive={handleArchiveTask}
            />
          ) : (
            <TaskListView
              tasks={tasks}
              updatingTaskId={updatingTaskId}
              canEditTask={(task) =>
                canUserEditTask(
                  task,
                  currentUser?.id,
                  activeWorkspace.currentUserRole,
                )
              }
              onOpenDetail={(task) => setSelectedTaskId(task.id)}
              onStatusChange={handleQuickStatusChange}
              onEdit={handleOpenEditModal}
              onArchive={handleArchiveTask}
            />
          )
        ) : null}
      </section>

      <TaskDetailDrawer
        workspaceId={activeWorkspaceId}
        task={selectedTask}
        currentUserId={currentUser?.id ?? null}
        isWorkspaceManager={canAssignOthers}
        canEdit={
          selectedTask
            ? canUserEditTask(
                selectedTask,
                currentUser?.id,
                activeWorkspace.currentUserRole,
              )
            : false
        }
        isUpdatingStatus={
          Boolean(selectedTask) && updatingTaskId === selectedTask?.id
        }
        onClose={() => setSelectedTaskId(null)}
        onEdit={(task) => handleOpenEditModal(task)}
        onArchive={(task) => handleArchiveTask(task)}
        onStatusChange={handleQuickStatusChange}
      />

      <TaskFormModal
        open={isFormOpen}
        workspaceId={activeWorkspaceId}
        projects={projects}
        defaultProjectId={projectFilter || undefined}
        defaultStatus={defaultModalStatus}
        task={editingTask}
        currentUserId={currentUser?.id ?? null}
        canAssignOthers={canAssignOthers}
        isSubmitting={isSubmittingModal}
        errorMessage={modalError}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
      />
    </>
  );
}
