import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

import {
  WORKSPACE_DESCRIPTION_MAX_LENGTH,
  WORKSPACE_NAME_MAX_LENGTH,
} from "@/features/workspaces/constants/workspace.constants";
import { useCreateWorkspace } from "@/features/workspaces/hooks/useWorkspaces";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

type CreateWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
};

type WorkspaceFormState = {
  name: string;
  description: string;
};

const initialFormState: WorkspaceFormState = {
  name: "",
  description: "",
};

export function CreateWorkspaceModal({
  open,
  onClose,
}: CreateWorkspaceModalProps) {
  const createWorkspaceMutation = useCreateWorkspace();

  const [form, setForm] = useState<WorkspaceFormState>(initialFormState);

  const [validationError, setValidationError] = useState<string | null>(null);

  const isCreating = createWorkspaceMutation.isPending;
  const resetCreateMutation = createWorkspaceMutation.reset;

  const resetForm = useCallback(() => {
    setForm(initialFormState);
    setValidationError(null);
    resetCreateMutation();
  }, [resetCreateMutation]);

  const handleClose = useCallback(() => {
    if (isCreating) {
      return;
    }

    resetForm();
    onClose();
  }, [isCreating, onClose, resetForm]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, open]);

  function handleBackdropMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function updateField(field: keyof WorkspaceFormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setValidationError(null);

    if (createWorkspaceMutation.isError) {
      createWorkspaceMutation.reset();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = form.name.trim();
    const normalizedDescription = form.description.trim();

    if (!normalizedName) {
      setValidationError("Vui lòng nhập tên workspace.");
      return;
    }

    if (normalizedName.length > WORKSPACE_NAME_MAX_LENGTH) {
      setValidationError(
        `Tên workspace không được vượt quá ${WORKSPACE_NAME_MAX_LENGTH} ký tự.`,
      );
      return;
    }

    if (normalizedDescription.length > WORKSPACE_DESCRIPTION_MAX_LENGTH) {
      setValidationError(
        `Mô tả không được vượt quá ${WORKSPACE_DESCRIPTION_MAX_LENGTH} ký tự.`,
      );
      return;
    }

    try {
      await createWorkspaceMutation.mutateAsync({
        name: normalizedName,
        description: normalizedDescription || undefined,
      });

      resetForm();
      onClose();
    } catch {
      // Mutation lưu lỗi để hiển thị phía dưới form.
    }
  }

  if (!open) {
    return null;
  }

  const requestError = createWorkspaceMutation.isError
    ? getApiErrorMessage(
        createWorkspaceMutation.error,
        "Không thể tạo workspace.",
      )
    : null;

  const error = validationError ?? requestError;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={handleBackdropMouseDown}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-workspace-title"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="create-workspace-title"
              className="text-xl font-semibold text-slate-950"
            >
              Tạo workspace
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tạo không gian làm việc mới cho dự án và thành viên.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isCreating}
            aria-label="Đóng cửa sổ tạo workspace"
            className="rounded-lg px-3 py-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5 px-6 py-5">
            <div>
              <label
                htmlFor="workspace-name"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Tên workspace
              </label>

              <input
                id="workspace-name"
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                maxLength={WORKSPACE_NAME_MAX_LENGTH}
                disabled={isCreating}
                autoFocus
                autoComplete="off"
                placeholder="Ví dụ: Etech Development Team"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {form.name.length}/{WORKSPACE_NAME_MAX_LENGTH}
              </p>
            </div>

            <div>
              <label
                htmlFor="workspace-description"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Mô tả
                <span className="ml-1 font-normal text-slate-400">
                  (không bắt buộc)
                </span>
              </label>

              <textarea
                id="workspace-description"
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                maxLength={WORKSPACE_DESCRIPTION_MAX_LENGTH}
                disabled={isCreating}
                rows={4}
                placeholder="Mô tả mục đích của workspace..."
                className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
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
          </div>

          <footer className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isCreating}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "Đang tạo..." : "Tạo workspace"}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
