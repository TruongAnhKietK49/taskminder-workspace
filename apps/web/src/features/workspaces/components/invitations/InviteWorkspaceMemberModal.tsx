import { useState, type FormEvent } from "react";

import { useInviteWorkspaceMember } from "@/features/workspaces/hooks/useWorkspaceInvitations";
import type {
  Workspace,
  WorkspaceRole,
} from "@/features/workspaces/types/workspace.types";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

type InviteWorkspaceMemberModalProps = {
  open: boolean;
  workspace: Workspace;
  onClose: () => void;
};

type AssignableRole = Exclude<WorkspaceRole, "OWNER">;

export function InviteWorkspaceMemberModal({
  open,
  workspace,
  onClose,
}: InviteWorkspaceMemberModalProps) {
  const inviteMutation = useInviteWorkspaceMember();

  const defaultRole: AssignableRole =
    workspace.currentUserRole === "OWNER" ? "ADMIN" : "MEMBER";

  const assignableRoles: AssignableRole[] =
    workspace.currentUserRole === "OWNER" ? ["ADMIN", "MEMBER"] : ["MEMBER"];

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole>(defaultRole);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(
    null,
  );

  function handleClose() {
    if (inviteMutation.isPending) {
      return;
    }

    setEmail("");
    setRole(defaultRole);
    setValidationError(null);
    setCreatedInviteLink(null);
    inviteMutation.reset();
    onClose();
  }

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setValidationError("Vui lòng nhập email người được mời.");
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setValidationError("Email không hợp lệ.");
      return;
    }

    setValidationError(null);
    setCreatedInviteLink(null);

    try {
      const invitation = await inviteMutation.mutateAsync({
        workspaceId: workspace.id,
        payload: {
          email: normalizedEmail,
          role,
        },
      });

      setEmail("");
      setRole(defaultRole);
      setCreatedInviteLink(
        `${window.location.origin}/workspace-invitations/${invitation.token}`,
      );
    } catch {
      // Mutation giữ lỗi để render.
    }
  }

  async function handleCopyInviteLink() {
    if (!createdInviteLink) {
      return;
    }

    await navigator.clipboard.writeText(createdInviteLink);
  }

  const requestError = inviteMutation.isError
    ? getApiErrorMessage(inviteMutation.error, "Không thể tạo lời mời.")
    : null;

  const error = validationError ?? requestError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Mời thành viên
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Gửi lời mời vào workspace {workspace.name}.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={inviteMutation.isPending}
              className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            >
              Đóng
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
          <div>
            <label
              htmlFor="invite-email"
              className="text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setValidationError(null);
                setCreatedInviteLink(null);

                if (inviteMutation.isError) {
                  inviteMutation.reset();
                }
              }}
              placeholder="member@example.com"
              disabled={inviteMutation.isPending}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="invite-role"
              className="text-sm font-medium text-slate-700"
            >
              Quyền
            </label>

            <select
              id="invite-role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as AssignableRole)
              }
              disabled={inviteMutation.isPending}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100"
            >
              {assignableRoles.map((assignableRole) => (
                <option key={assignableRole} value={assignableRole}>
                  {assignableRole === "ADMIN" ? "Quản trị viên" : "Thành viên"}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {createdInviteLink && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-medium text-emerald-800">
                Đã tạo lời mời. Copy link này gửi cho người được mời:
              </p>

              <div className="mt-2 flex gap-2">
                <input
                  value={createdInviteLink}
                  readOnly
                  className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-600"
                />

                <button
                  type="button"
                  onClick={() => void handleCopyInviteLink()}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={inviteMutation.isPending}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {inviteMutation.isPending ? "Đang mời..." : "Tạo lời mời"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
