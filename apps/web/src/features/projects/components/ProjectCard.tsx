import {
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_LABELS,
} from "@/features/projects/constants/project.constants";
import type { Project } from "@/features/projects/types/project.types";

type ProjectCardProps = {
  project: Project;
  workspaceId: string;
  canManage: boolean;
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function ProjectCard({
  project,
  canManage,
  onEdit,
  onArchive,
}: ProjectCardProps) {
  const isArchived = project.status === "ARCHIVED";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="block truncate text-lg font-semibold text-slate-950">
            {project.name}
          </h3>

          <p className="mt-2 line-clamp-2 min-h-[3rem] text-sm leading-6 text-slate-600">
            {project.description || "Chưa có mô tả cho project này."}
          </p>
        </div>

        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
            PROJECT_STATUS_BADGE_CLASSES[project.status],
          ].join(" ")}
        >
          {PROJECT_STATUS_LABELS[project.status]}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Members
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {project.memberCount}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Updated
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {formatDate(project.updatedAt)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="min-w-0 text-xs text-slate-500">
          <span>Created by </span>
          <span className="font-medium text-slate-700">
            {project.createdBy.fullName}
          </span>
        </div>

        {canManage ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(project)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>

            {!isArchived ? (
              <button
                type="button"
                onClick={() => onArchive(project)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Archive
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
