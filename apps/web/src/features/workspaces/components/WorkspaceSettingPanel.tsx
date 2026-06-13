import { useState, type FormEvent } from "react";

import {
  WORKSPACE_DESCRIPTION_MAX_LENGTH,
  WORKSPACE_NAME_MAX_LENGTH,
  WORKSPACE_ROLE_LABELS,
} from "@/features/workspaces/constants/workspace.constants";
import {
  useDeleteWorkspace,
  useUpdateWorkspace,
} from "@/features/workspaces/hooks/useWorkspaces";
import type { Workspace } from "@/features/workspaces/types/workspace.types";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

type WorkspaceSettingPanelProps = {
  workspace: Workspace;
};

type SettingsFormState = {
  name: string;
  description: string;
};

export function WorkspaceSettingPanel({
  workspace,
}: WorkspaceSettingPanelProps) {
  const updateWorkspaceMutation = useUpdateWorkspace();
  const deleteWorkspaceMutation = useDeleteWorkspace();

  const [form, setForm] = useState<SettingsFormState>({
    name: workspace.name,
    description: workspace.description ?? "",
  });

  const [error, setError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canEdit =
    workspace.currentUserRole === "OWNER" ||
    workspace.currentUserRole === "ADMIN";

  const canDelete = workspace.currentUserRole === "OWNER";

  const isBusy =
    updateWorkspaceMutation.isPending || deleteWorkspaceMutation.isPending;

  const normalizedName = form.name.trim();
  const normalizedDescription = form.description.trim();

  const currentWorkspaceDescription = workspace.description?.trim() ?? "";

  const isDirty =
    normalizedName !== workspace.name ||
    normalizedDescription !== currentWorkspaceDescription;

  function updateField(field: keyof SettingsFormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setError(null);
    setSuccessMessage(null);

    if (updateWorkspaceMutation.isError) {
      updateWorkspaceMutation.reset();
    }

    if (deleteWorkspaceMutation.isError) {
      deleteWorkspaceMutation.reset();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit || isBusy || !isDirty) {
      return;
    }

    if (!normalizedName) {
      setError("Tên workspace không được để trống.");
      return;
    }

    if (normalizedName.length > WORKSPACE_NAME_MAX_LENGTH) {
      setError(
        `Tên workspace không được vượt quá ${WORKSPACE_NAME_MAX_LENGTH} ký tự.`,
      );
      return;
    }

    if (normalizedDescription.length > WORKSPACE_DESCRIPTION_MAX_LENGTH) {
      setError(
        `Mô tả không được vượt quá ${WORKSPACE_DESCRIPTION_MAX_LENGTH} ký tự.`,
      );
      return;
    }

    setError(null);
    setSuccessMessage(null);

    try {
      await updateWorkspaceMutation.mutateAsync({
        workspaceId: workspace.id,
        payload: {
          name: normalizedName,
          description: normalizedDescription,
        },
      });

      setForm({
        name: normalizedName,
        description: normalizedDescription,
      });

      setSuccessMessage("Đã cập nhật workspace.");
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Không thể cập nhật workspace."),
      );
    }
  }

  async function handleDelete() {
    if (!canDelete || isBusy) {
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa workspace "${workspace.name}"? Hành động này không thể hoàn tác.`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    try {
      await deleteWorkspaceMutation.mutateAsync(workspace.id);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Không thể xóa workspace."));
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Cài đặt workspace
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Quản lý thông tin của workspace đang được chọn.
            </p>
          </div>

          <div className="text-right text-sm">
            <p className="font-medium text-slate-700">
              {WORKSPACE_ROLE_LABELS[workspace.currentUserRole]}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {workspace.memberCount} thành viên
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5 px-6 py-5">
          {!canEdit && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Bạn có quyền xem nhưng không có quyền chỉnh sửa workspace này.
            </div>
          )}

          <div>
            <label
              htmlFor="settings-workspace-name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Tên workspace
            </label>

            <input
              id="settings-workspace-name"
              type="text"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              maxLength={WORKSPACE_NAME_MAX_LENGTH}
              disabled={!canEdit || isBusy}
              autoComplete="off"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />

            <p className="mt-1 text-right text-xs text-slate-400">
              {form.name.length}/{WORKSPACE_NAME_MAX_LENGTH}
            </p>
          </div>

          <div>
            <label
              htmlFor="settings-workspace-description"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Mô tả
            </label>

            <textarea
              id="settings-workspace-description"
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              maxLength={WORKSPACE_DESCRIPTION_MAX_LENGTH}
              disabled={!canEdit || isBusy}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />

            <p className="mt-1 text-right text-xs text-slate-400">
              {form.description.length}/{WORKSPACE_DESCRIPTION_MAX_LENGTH}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              {successMessage}
            </div>
          )}
        </div>

        {canEdit && (
          <footer className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="submit"
              disabled={!isDirty || isBusy}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateWorkspaceMutation.isPending
                ? "Đang lưu..."
                : "Lưu thay đổi"}
            </button>
          </footer>
        )}
      </form>

      {canDelete && (
        <div className="border-t border-red-100 bg-red-50/50 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-red-800">Xóa workspace</h3>

              <p className="mt-1 text-sm text-red-600">
                Hành động này không thể hoàn tác.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isBusy}
              className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteWorkspaceMutation.isPending
                ? "Đang xóa..."
                : "Xóa workspace"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
