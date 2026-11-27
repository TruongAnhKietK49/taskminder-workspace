import { useState } from "react";

import {
  useAcceptWorkspaceInvitation,
  useMyWorkspaceInvitationsQuery,
  useRejectWorkspaceInvitation,
} from "@/features/workspaces/hooks/useWorkspaceInvitations";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { toast } from "@/shared/stores/toast.store";

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

type ActiveAction = {
  token: string;
  type: "accept" | "reject";
} | null;

export function IncomingWorkspaceInvitationsBanner() {
  const invitationsQuery = useMyWorkspaceInvitationsQuery();
  const acceptMutation = useAcceptWorkspaceInvitation();
  const rejectMutation = useRejectWorkspaceInvitation();
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);

  const invitations = invitationsQuery.data ?? [];

  if (
    invitationsQuery.isLoading ||
    invitationsQuery.isError ||
    invitations.length === 0
  ) {
    return null;
  }

  async function handleAccept(token: string) {
    setActiveAction({ token, type: "accept" });
    try {
      await acceptMutation.mutateAsync(token);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xử lý lời mời."));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleReject(token: string) {
    setActiveAction({ token, type: "reject" });
    try {
      await rejectMutation.mutateAsync(token);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xử lý lời mời."));
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-500/30 dark:bg-blue-950/25">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">
            Lời mời tham gia Workspace gửi đến bạn
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Chấp nhận lời mời để truy cập ngay vào không gian làm việc của nhóm.
          </p>
        </div>

        <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
          {invitations.length} lời mời đang chờ
        </span>
      </div>

      <div className="mt-4 divide-y divide-blue-100 overflow-hidden rounded-xl border border-blue-200/80 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {invitations.map((invitation) => {
          const isRowBusy = activeAction?.token === invitation.token;
          const isAccepting =
            isRowBusy && activeAction?.type === "accept";
          const isRejecting =
            isRowBusy && activeAction?.type === "reject";
          const inviterName =
            invitation.invitedBy.fullName || invitation.invitedBy.email;
          const roleLabel =
            invitation.role === "ADMIN" ? "Quản trị viên" : "Thành viên";

          return (
            <div
              key={invitation.id}
              className="flex flex-wrap items-center justify-between gap-4 px-4 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-slate-950 dark:text-slate-100">
                    {invitation.workspace.name}
                  </p>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {roleLabel}
                  </span>
                </div>

                {invitation.workspace.description ? (
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                    {invitation.workspace.description}
                  </p>
                ) : null}

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Mời bởi {inviterName} · Hết hạn{" "}
                  {dateTimeFormatter.format(new Date(invitation.expiresAt))}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={activeAction !== null}
                  onClick={() => void handleAccept(invitation.token)}
                  className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAccepting ? "Đang chấp nhận..." : "Chấp nhận"}
                </button>

                <button
                  type="button"
                  disabled={activeAction !== null}
                  onClick={() => void handleReject(invitation.token)}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {isRejecting ? "Đang từ chối..." : "Từ chối"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
