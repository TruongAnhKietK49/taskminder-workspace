import { useMemo } from "react";

import { useWorkspaceInvitationsQuery } from "@/features/workspaces/hooks/useWorkspaceInvitations";
import type { Workspace } from "@/features/workspaces/types/workspace.types";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

type PendingWorkspaceInvitationsListProps = {
  workspace: Workspace;
};

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function PendingWorkspaceInvitationsList({
  workspace,
}: PendingWorkspaceInvitationsListProps) {
  const invitationsQuery = useWorkspaceInvitationsQuery(workspace.id);

  const pendingInvitations = useMemo(() => {
    return (invitationsQuery.data ?? []).filter(
      (invitation) => invitation.status === "PENDING",
    );
  }, [invitationsQuery.data]);

  async function handleCopy(token: string) {
    const link = `${window.location.origin}/workspace-invitations/${token}`;

    await navigator.clipboard.writeText(link);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">Lời mời đang chờ</h3>

          <p className="mt-1 text-sm text-slate-500">
            Theo dõi các email đã được mời nhưng chưa accept.
          </p>
        </div>

        <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600">
          {pendingInvitations.length} pending
        </span>
      </div>

      {invitationsQuery.isLoading && (
        <div className="mt-4 space-y-2">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-16 animate-pulse rounded-xl bg-white"
            />
          ))}
        </div>
      )}

      {invitationsQuery.isError && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {getApiErrorMessage(
            invitationsQuery.error,
            "Không thể tải danh sách lời mời.",
          )}
        </div>
      )}

      {!invitationsQuery.isLoading &&
        !invitationsQuery.isError &&
        pendingInvitations.length === 0 && (
          <p className="mt-4 rounded-xl bg-white px-4 py-5 text-center text-sm text-slate-500">
            Chưa có lời mời nào đang chờ.
          </p>
        )}

      {pendingInvitations.length > 0 && (
        <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {pendingInvitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-950">
                  {invitation.email}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Role:{" "}
                  {invitation.role === "ADMIN" ? "Quản trị viên" : "Thành viên"}{" "}
                  · Hết hạn{" "}
                  {dateTimeFormatter.format(new Date(invitation.expiresAt))}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleCopy(invitation.token)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Copy link
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
