import { useState, type FormEvent } from "react";

import { useAddWorkspaceMember } from "@/features/workspaces/hooks/useWorkspaceMembers";
import type {
  Workspace,
  WorkspaceRole,
} from "@/features/workspaces/types/workspace.types";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

type AddWorkspaceMemberFormProps = {
  workspace: Workspace;
};

type AssignableRole = Exclude<WorkspaceRole, "OWNER">;

export function AddWorkspaceMemberForm({
  workspace,
}: AddWorkspaceMemberFormProps) {
  const addMemberMutation = useAddWorkspaceMember();

  const defaultRole: AssignableRole =
    workspace.currentUserRole === "OWNER" ? "ADMIN" : "MEMBER";

  const assignableRoles: AssignableRole[] =
    workspace.currentUserRole === "OWNER" ? ["ADMIN", "MEMBER"] : ["MEMBER"];

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole>(defaultRole);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setValidationError("Vui lòng nhập email thành viên.");
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setValidationError("Email không hợp lệ.");
      return;
    }

    setValidationError(null);

    try {
      await addMemberMutation.mutateAsync({
        workspaceId: workspace.id,
        payload: {
          email: normalizedEmail,
          role,
        },
      });

      setEmail("");
      setRole(assignableRoles[0]);
    } catch {
      // Mutation giữ lỗi để render.
    }
  }

  const requestError = addMemberMutation.isError
    ? getApiErrorMessage(addMemberMutation.error, "Không thể thêm thành viên.")
    : null;

  const error = validationError ?? requestError;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
      noValidate
    >
      <div className="mb-4">
        <h3 className="font-semibold text-slate-950">Thêm thành viên</h3>

        <p className="mt-1 text-sm text-slate-500">
          Người dùng phải đăng ký tài khoản trước khi được thêm vào workspace.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_auto]">
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setValidationError(null);

            if (addMemberMutation.isError) {
              addMemberMutation.reset();
            }
          }}
          placeholder="member@example.com"
          disabled={addMemberMutation.isPending}
          className="min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100"
        />

        <select
          value={role}
          onChange={(event) => setRole(event.target.value as AssignableRole)}
          disabled={addMemberMutation.isPending}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100"
        >
          {assignableRoles.map((assignableRole) => (
            <option key={assignableRole} value={assignableRole}>
              {assignableRole === "ADMIN" ? "Quản trị viên" : "Thành viên"}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={addMemberMutation.isPending}
          className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {addMemberMutation.isPending ? "Đang thêm..." : "Thêm"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}
    </form>
  );
}
