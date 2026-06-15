import { type FormEvent, useEffect, useMemo, useState } from "react";

import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_STATUS_OPTIONS,
} from "@/features/projects/constants/project.constants";
import type {
  CreateProjectPayload,
  Project,
  ProjectStatus,
  UpdateProjectPayload,
} from "@/features/projects/types/project.types";

type ProjectFormModalProps = {
  open: boolean;
  project?: Project | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateProjectPayload | UpdateProjectPayload) => void;
};

export function ProjectFormModal({
  open,
  project,
  isSubmitting = false,
  onClose,
  onSubmit,
}: ProjectFormModalProps) {
  const isEditMode = Boolean(project);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("PLANNING");

  const title = useMemo(() => {
    return isEditMode ? "Edit project" : "Create project";
  }, [isEditMode]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(project?.name ?? "");
    setDescription(project?.description ?? "");
    setStatus(project?.status ?? "PLANNING");
  }, [open, project]);

  if (!open) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = name.trim();
    const normalizedDescription = description.trim();

    if (!normalizedName) {
      return;
    }

    if (isEditMode) {
      onSubmit({
        name: normalizedName,
        description: normalizedDescription,
        status,
      });

      return;
    }

    onSubmit({
      name: normalizedName,
      description: normalizedDescription,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isEditMode
              ? "Cập nhật thông tin và trạng thái project."
              : "Tạo project mới trong workspace hiện tại."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div>
            <label
              htmlFor="project-name"
              className="text-sm font-medium text-slate-700"
            >
              Project name
            </label>

            <input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={PROJECT_NAME_MAX_LENGTH}
              placeholder="Ví dụ: TaskMinder Web App"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>Bắt buộc</span>
              <span>
                {name.length}/{PROJECT_NAME_MAX_LENGTH}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="project-description"
              className="text-sm font-medium text-slate-700"
            >
              Description
            </label>

            <textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
              rows={5}
              placeholder="Mô tả mục tiêu, phạm vi hoặc ghi chú của project..."
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <div className="mt-1 flex justify-end text-xs text-slate-500">
              <span>
                {description.length}/{PROJECT_DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
          </div>

          {isEditMode ? (
            <div>
              <label
                htmlFor="project-status"
                className="text-sm font-medium text-slate-700"
              >
                Status
              </label>

              <select
                id="project-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ProjectStatus)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {PROJECT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <p className="mt-1 text-xs text-slate-500">
                Có thể chuyển project sang Planning, Active, On hold, Completed
                hoặc Archived.
              </p>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Save changes"
                  : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
