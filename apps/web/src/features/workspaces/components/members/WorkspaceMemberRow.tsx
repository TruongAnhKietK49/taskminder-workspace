import { useState } from "react";

import { PresenceDot } from "@/features/chat/components/PresenceDot";
import { useRealtimeStore } from "@/features/chat/stores/realtime.store";
import type { PresenceStatus } from "@/features/chat/types/chat.types";
import { WORKSPACE_ROLE_LABELS } from "@/features/workspaces/constants/workspace.constants";
import {
  useRemoveWorkspaceMember,
  useUpdateWorkspaceMemberRole,
} from "@/features/workspaces/hooks/useWorkspaceMembers";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from "@/features/workspaces/types/workspace.types";
import { SelectDropdown } from "@/shared/components/SelectDropdown";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

type WorkspaceMemberRowProps = {
  workspace: Workspace;
  member: WorkspaceMember;
  currentUserId: string | undefined;
};

type EditableRole = Exclude<WorkspaceRole, "OWNER">;

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
});

function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function WorkspaceMemberRow({
  workspace,
  member,
  currentUserId,
}: WorkspaceMemberRowProps) {
  const updateRoleMutation = useUpdateWorkspaceMemberRole();
  const removeMemberMutation = useRemoveWorkspaceMember();
  const presencesByUserId = useRealtimeStore(
    (state) => state.presencesByUserId,
  );
  const presenceStatus: PresenceStatus =
    presencesByUserId[member.user.id]?.status ?? "OFFLINE";

  const [actionError, setActionError] = useState<string | null>(null);

  const isCurrentUser = member.user.id === currentUserId;
  const isOwner = member.role === "OWNER";

  const canChangeRole = workspace.currentUserRole === "OWNER" && !isOwner;

  const canRemove =
    !isOwner &&
    !isCurrentUser &&
    (workspace.currentUserRole === "OWNER" ||
      (workspace.currentUserRole === "ADMIN" && member.role === "MEMBER"));

  async function handleRoleChange(role: EditableRole) {
    setActionError(null);

    try {
      await updateRoleMutation.mutateAsync({
        workspaceId: workspace.id,
        memberId: member.id,
        role,
      });
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Không thể cập nhật quyền."));
    }
  }

  async function handleRemove() {
    const confirmed = window.confirm(
      `Xóa ${member.user.fullName} khỏi workspace?`,
    );

    if (!confirmed) {
      return;
    }

    setActionError(null);

    try {
      await removeMemberMutation.mutateAsync({
        workspaceId: workspace.id,
        memberId: member.id,
      });
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Không thể xóa thành viên."));
    }
  }

  const isBusy = updateRoleMutation.isPending || removeMemberMutation.isPending;

  return (
    <div className="border-b border-slate-100 px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-3.5">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-xs font-bold text-white">
          {getInitials(member.user.fullName)}
          <PresenceDot
            status={presenceStatus}
            className="absolute -bottom-0.5 -right-0.5"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-slate-950">
              {member.user.fullName}
            </p>

            {isCurrentUser && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                Bạn
              </span>
            )}
          </div>

          <p className="truncate text-sm text-slate-500">{member.user.email}</p>

          <p className="mt-1 text-xs text-slate-400">
            Tham gia {dateFormatter.format(new Date(member.joinedAt))}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canChangeRole ? (
            <SelectDropdown
              ariaLabel="Đổi vai trò thành viên"
              size="sm"
              align="right"
              value={member.role}
              disabled={isBusy}
              className="w-36"
              onChange={(val) => void handleRoleChange(val as EditableRole)}
              options={[
                { value: "ADMIN", label: "Quản trị viên" },
                { value: "MEMBER", label: "Thành viên" },
              ]}
            />
          ) : (
            <span className="min-w-24 rounded-xl bg-slate-100 px-3 py-1.5 text-center text-xs font-semibold text-slate-600">
              {WORKSPACE_ROLE_LABELS[member.role]}
            </span>
          )}

          {canRemove && (
            <button
              type="button"
              onClick={() => void handleRemove()}
              disabled={isBusy}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {removeMemberMutation.isPending ? "Đang xóa..." : "Xóa"}
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}
    </div>
  );
}
