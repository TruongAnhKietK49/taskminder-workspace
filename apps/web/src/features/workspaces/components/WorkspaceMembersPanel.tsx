import { AddWorkspaceMemberForm } from "@/features/workspaces/components/members/AddWorkspaceMemberForm";
import { WorkspaceMemberRow } from "@/features/workspaces/components/members/WorkspaceMemberRow";
import { useWorkspaceMembersQuery } from "@/features/workspaces/hooks/useWorkspaceMembers";
import type { Workspace } from "@/features/workspaces/types/workspace.types";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

type WorkspaceMembersPanelProps = {
  workspace: Workspace;
};

export function WorkspaceMembersPanel({
  workspace,
}: WorkspaceMembersPanelProps) {
  const currentUser = useAuthStore((state) => state.user);

  const membersQuery = useWorkspaceMembersQuery(workspace.id);

  const canManageMembers =
    workspace.currentUserRole === "OWNER" ||
    workspace.currentUserRole === "ADMIN";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Thành viên workspace
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Quản lý người dùng và quyền truy cập trong workspace.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
            {membersQuery.data?.length ?? workspace.memberCount} thành viên
          </span>
        </div>
      </header>

      <div className="space-y-5 p-6">
        {canManageMembers && (
          <AddWorkspaceMemberForm
            key={`${workspace.id}:${workspace.currentUserRole}`}
            workspace={workspace}
          />
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
  );
}
