import { useState } from "react";

import { InviteWorkspaceMemberModal } from "@/features/workspaces/components/invitations/InviteWorkspaceMemberModal";
import { PendingWorkspaceInvitationsList } from "@/features/workspaces/components/invitations/PendingWorkspaceInvitationsList";
import { WorkspaceMemberRow } from "@/features/workspaces/components/members/WorkspaceMemberRow";
import { useWorkspaceMembersQuery } from "@/features/workspaces/hooks/useWorkspaceMembers";
import type { Workspace } from "@/features/workspaces/types/workspace.types";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

type WorkspaceMembersPanelProps = {
  workspace: Workspace;
  embedded?: boolean;
};

export function WorkspaceMembersPanel({
  workspace,
  embedded = false,
}: WorkspaceMembersPanelProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const membersQuery = useWorkspaceMembersQuery(workspace.id);

  const canManageMembers =
    workspace.currentUserRole === "OWNER" ||
    workspace.currentUserRole === "ADMIN";

  return (
    <>
      <section
        className={
          embedded
            ? ""
            : "rounded-2xl border border-slate-200 bg-white shadow-sm"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-950">
              Thành viên workspace
            </h2>
            <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {membersQuery.data?.length ?? workspace.memberCount}
            </span>
          </div>

          {canManageMembers && (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs shadow-blue-500/20 transition hover:from-blue-700 hover:to-sky-600"
            >
              + Mời thành viên
            </button>
          )}
        </div>

        <div className="space-y-4 p-4">
          {canManageMembers && (
            <PendingWorkspaceInvitationsList workspace={workspace} />
          )}

          {!canManageMembers && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Bạn có quyền xem thành viên nhưng không có quyền quản lý.
            </div>
          )}

          {membersQuery.isLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          )}

          {membersQuery.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                {getApiErrorMessage(
                  membersQuery.error,
                  "Không thể tải danh sách thành viên.",
                )}
              </p>

              <button
                type="button"
                onClick={() => void membersQuery.refetch()}
                className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700"
              >
                Thử lại
              </button>
            </div>
          )}
        </div>

        {membersQuery.data && membersQuery.data.length > 0 && (
          <div className="border-t border-slate-200">
            {membersQuery.data.map((member) => (
              <WorkspaceMemberRow
                key={member.id}
                workspace={workspace}
                member={member}
                currentUserId={currentUser?.id}
              />
            ))}
          </div>
        )}
      </section>

      <InviteWorkspaceMemberModal
        open={isInviteModalOpen}
        workspace={workspace}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </>
  );
}
