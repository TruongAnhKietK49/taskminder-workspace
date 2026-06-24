import { useMemo, useState } from "react";

import { ProjectCard } from "@/features/projects/components/ProjectCard";
import { ProjectFormModal } from "@/features/projects/components/ProjectFormModal";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_OPTIONS,
} from "@/features/projects/constants/project.constants";
import {
  useArchiveProject,
  useCreateProject,
  useProjectsQuery,
  useUpdateProject,
} from "@/features/projects/hooks/useProjects";
import type {
  CreateProjectPayload,
  Project,
  ProjectStatus,
  UpdateProjectPayload,
} from "@/features/projects/types/project.types";
import { useWorkspaceSelection } from "@/features/workspaces/hooks/useWorkspaceSelection";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

type ProjectStatusFilter = "ALL" | ProjectStatus;

export function ProjectsPage() {
  const {
    activeWorkspace,
    activeWorkspaceId,
    isLoading: isLoadingWorkspace,
    isError: isWorkspaceError,
    error: workspaceError,
    refetch: refetchWorkspaces,
  } = useWorkspaceSelection();

  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const projectsQuery = useProjectsQuery(activeWorkspaceId);
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const archiveProjectMutation = useArchiveProject();

  const projects = useMemo(
    () => projectsQuery.data ?? [],
    [projectsQuery.data],
  );

  const filteredProjects = useMemo(() => {
    if (statusFilter === "ALL") {
      return projects;
    }

    return projects.filter((project) => project.status === statusFilter);
  }, [projects, statusFilter]);

  const projectStats = useMemo(() => {
    return PROJECT_STATUS_OPTIONS.map((option) => ({
      status: option.value,
      label: option.label,
      count: projects.filter((project) => project.status === option.value)
        .length,
    }));
  }, [projects]);

  const isSubmitting =
    createProjectMutation.isPending || updateProjectMutation.isPending;

  const canManageProjects =
    activeWorkspace?.currentUserRole === "OWNER" ||
    activeWorkspace?.currentUserRole === "ADMIN";

  function handleOpenCreateModal() {
    setEditingProject(null);
    setIsFormOpen(true);
  }

  function handleOpenEditModal(project: Project) {
    setEditingProject(project);
    setIsFormOpen(true);
  }

  function handleCloseModal() {
    if (isSubmitting) {
      return;
    }

    setIsFormOpen(false);
    setEditingProject(null);
  }

  function handleSubmit(payload: CreateProjectPayload | UpdateProjectPayload) {
    if (!activeWorkspaceId) {
      return;
    }

    if (editingProject) {
      updateProjectMutation.mutate(
        {
          workspaceId: activeWorkspaceId,
          projectId: editingProject.id,
          payload,
        },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingProject(null);
          },
        },
      );

      return;
    }

    createProjectMutation.mutate(
      {
        workspaceId: activeWorkspaceId,
        payload: payload as CreateProjectPayload,
      },
      {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingProject(null);
        },
      },
    );
  }

  function handleArchiveProject(project: Project) {
    if (!activeWorkspaceId) {
      return;
    }

    const confirmed = window.confirm(
      `Archive project "${project.name}"? Bạn vẫn có thể xem project này ở trạng thái Archived.`,
    );

    if (!confirmed) {
      return;
    }

    archiveProjectMutation.mutate({
      workspaceId: activeWorkspaceId,
      projectId: project.id,
    });
  }

  if (isLoadingWorkspace) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-2xl bg-slate-200"
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
          Bạn cần tạo hoặc chọn workspace trước khi quản lý project.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-8">
        <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-slate-950 to-slate-800 p-6 text-white shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-blue-200">
              {activeWorkspace.name}
            </p>

            <h1 className="mt-2 text-2xl font-bold md:text-3xl">
              Project management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Quản lý project trong workspace hiện tại, theo dõi trạng thái và
              chuẩn bị cho task, member, dashboard ở các sprint tiếp theo.
            </p>
          </div>

          {canManageProjects ? (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-blue-50"
            >
              + Create project
            </button>
          ) : null}
        </header>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={[
              "rounded-2xl border p-4 text-left transition",
              statusFilter === "ALL"
                ? "border-blue-300 bg-blue-50 ring-4 ring-blue-100"
                : "border-slate-200 bg-white hover:bg-slate-50",
            ].join(" ")}
          >
            <p className="text-sm font-medium text-slate-500">All</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {projects.length}
            </p>
          </button>

          {projectStats.map((stat) => (
            <button
              key={stat.status}
              type="button"
              onClick={() => setStatusFilter(stat.status)}
              className={[
                "rounded-2xl border p-4 text-left transition",
                statusFilter === stat.status
                  ? "border-blue-300 bg-blue-50 ring-4 ring-blue-100"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              ].join(" ")}
            >
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {stat.count}
              </p>
            </button>
          ))}
        </section>

        {projectsQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : null}

        {projectsQuery.isError ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-800">
              Không thể tải project
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {getApiErrorMessage(projectsQuery.error)}
            </p>

            <button
              type="button"
              onClick={() => void projectsQuery.refetch()}
              className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Thử lại
            </button>
          </section>
        ) : null}

        {!projectsQuery.isLoading && !projectsQuery.isError ? (
          filteredProjects.length > 0 ? (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  workspaceId={activeWorkspaceId}
                  canManage={canManageProjects}
                  onEdit={handleOpenEditModal}
                  onArchive={handleArchiveProject}
                />
              ))}
            </section>
          ) : (
            <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-lg font-semibold text-slate-950">
                {statusFilter === "ALL"
                  ? "Chưa có project nào"
                  : `Không có project ở trạng thái ${
                      PROJECT_STATUS_LABELS[statusFilter]
                    }`}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Tạo project đầu tiên trong workspace để bắt đầu quản lý công
                việc, thành viên và task.
              </p>

              {canManageProjects ? (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Create project
                </button>
              ) : null}
            </section>
          )
        ) : null}
      </section>

      <ProjectFormModal
        open={isFormOpen}
        project={editingProject}
        isSubmitting={isSubmitting}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />
    </>
  );
}
