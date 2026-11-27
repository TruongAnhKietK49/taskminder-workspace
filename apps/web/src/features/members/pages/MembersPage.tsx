import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { PresenceDot } from "@/features/chat/components/PresenceDot";
import { useCreateDirectConversation } from "@/features/chat/hooks/useChat";
import { useRealtimeStore } from "@/features/chat/stores/realtime.store";
import type { PresenceStatus } from "@/features/chat/types/chat.types";
import { PRESENCE_META } from "@/features/chat/utils/chat-helpers";
import { InviteWorkspaceMemberModal } from "@/features/workspaces/components/invitations/InviteWorkspaceMemberModal";
import { PendingWorkspaceInvitationsList } from "@/features/workspaces/components/invitations/PendingWorkspaceInvitationsList";
import { WORKSPACE_ROLE_LABELS } from "@/features/workspaces/constants/workspace.constants";
import {
  useRemoveWorkspaceMember,
  useUpdateWorkspaceMemberRole,
  useWorkspaceMembersQuery,
} from "@/features/workspaces/hooks/useWorkspaceMembers";
import { useWorkspaceSelection } from "@/features/workspaces/hooks/useWorkspaceSelection";
import type { WorkspaceRole } from "@/features/workspaces/types/workspace.types";
import { SelectDropdown } from "@/shared/components/SelectDropdown";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { toast } from "@/shared/stores/toast.store";

type RoleFilter = "ALL" | WorkspaceRole;
type PresenceFilter = "ALL" | "ONLINE_ONLY";
type EditableRole = Exclude<WorkspaceRole, "OWNER">;

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
});

export function MembersPage() {
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { activeWorkspace, activeWorkspaceId } = useWorkspaceSelection();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [presenceFilter, setPresenceFilter] = useState<PresenceFilter>("ALL");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const membersQuery = useWorkspaceMembersQuery(activeWorkspaceId);
  const updateRoleMutation = useUpdateWorkspaceMemberRole();
  const removeMemberMutation = useRemoveWorkspaceMember();
  const createDmMutation = useCreateDirectConversation(activeWorkspaceId);
  const presencesByUserId = useRealtimeStore(
    (state) => state.presencesByUserId,
  );

  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);

  const onlineCount = useMemo(
    () =>
      members.filter((m) => {
        const status = presencesByUserId[m.user.id]?.status ?? "OFFLINE";
        return status !== "OFFLINE";
      }).length,
    [members, presencesByUserId],
  );

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((member) => {
      if (roleFilter !== "ALL" && member.role !== roleFilter) {
        return false;
      }
      const status: PresenceStatus =
        presencesByUserId[member.user.id]?.status ?? "OFFLINE";
      if (presenceFilter === "ONLINE_ONLY" && status === "OFFLINE") {
        return false;
      }
      if (!q) return true;
      return (
        member.user.fullName.toLowerCase().includes(q) ||
        member.user.email.toLowerCase().includes(q)
      );
    });
  }, [members, presencesByUserId, presenceFilter, roleFilter, search]);

  if (!activeWorkspace || !activeWorkspaceId) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-950">
          Chưa chọn Workspace
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Hãy chọn hoặc tạo một workspace để quản lý thành viên.
        </p>
        <Link
          to={ROUTE_PATHS.WORKSPACES}
          className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Đi tới Workspaces
        </Link>
      </section>
    );
  }

  const canManageMembers =
    activeWorkspace.currentUserRole === "OWNER" ||
    activeWorkspace.currentUserRole === "ADMIN";

  async function handleRoleChange(memberId: string, role: EditableRole) {
    if (!activeWorkspaceId) return;
    try {
      await updateRoleMutation.mutateAsync({
        workspaceId: activeWorkspaceId,
        memberId,
        role,
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể đổi vai trò."));
    }
  }

  async function handleRemove(memberId: string, fullName: string) {
    if (!activeWorkspaceId) return;
    const confirmed = window.confirm(
      `Xóa ${fullName} khỏi workspace ${activeWorkspace?.name ?? ""}?`,
    );
    if (!confirmed) return;

    try {
      await removeMemberMutation.mutateAsync({
        workspaceId: activeWorkspaceId,
        memberId,
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xóa thành viên."));
    }
  }

  async function handleStartDm(targetUserId: string) {
    const conv = await createDmMutation.mutateAsync(targetUserId);
    navigate(`${ROUTE_PATHS.CHAT}?conversationId=${conv.id}`);
  }

  return (
    <>
      <section className="space-y-4">
        <header className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-5 py-4 text-white shadow-md shadow-blue-500/15 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-100">
              {activeWorkspace.name} · Members Hub
            </p>
            <h1 className="mt-1 text-xl font-bold md:text-2xl">
              Quản lý thành viên
            </h1>
            <p className="mt-1 text-xs text-blue-50 md:text-sm">
              {onlineCount} đang hoạt động / {members.length} thành viên trong
              workspace.
            </p>
          </div>

          {canManageMembers ? (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-blue-700 shadow-xs hover:bg-sky-50"
            >
              + Mời thành viên
            </button>
          ) : null}
        </header>

        {canManageMembers ? (
          <PendingWorkspaceInvitationsList workspace={activeWorkspace} />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500 sm:w-72"
          />

          <div className="flex flex-wrap items-center gap-2">
            <SelectDropdown
              ariaLabel="Lọc theo vai trò"
              value={roleFilter}
              onChange={(val) => setRoleFilter(val as RoleFilter)}
              className="w-40"
              options={[
                { value: "ALL", label: "Tất cả vai trò" },
                { value: "OWNER", label: "Chủ sở hữu" },
                { value: "ADMIN", label: "Quản trị viên" },
                { value: "MEMBER", label: "Thành viên" },
              ]}
            />

            <SelectDropdown
              ariaLabel="Lọc theo trạng thái"
              value={presenceFilter}
              align="right"
              onChange={(val) => setPresenceFilter(val as PresenceFilter)}
              className="w-44"
              options={[
                { value: "ALL", label: "Mọi trạng thái" },
                { value: "ONLINE_ONLY", label: "Đang trực tuyến" },
              ]}
            />
          </div>
        </div>

        {membersQuery.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Không tìm thấy thành viên nào phù hợp.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {filteredMembers.map((member) => {
              const isCurrentUser = member.user.id === currentUserId;
              const isOwner = member.role === "OWNER";
              const canChangeRole =
                activeWorkspace.currentUserRole === "OWNER" && !isOwner;
              const canRemove =
                !isOwner &&
                !isCurrentUser &&
                (activeWorkspace.currentUserRole === "OWNER" ||
                  (activeWorkspace.currentUserRole === "ADMIN" &&
                    member.role === "MEMBER"));
              const status: PresenceStatus =
                presencesByUserId[member.user.id]?.status ?? "OFFLINE";

              return (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {member.user.fullName.charAt(0).toUpperCase()}
                      <PresenceDot
                        status={status}
                        size="md"
                        className="absolute -bottom-0.5 -right-0.5"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-950">
                          {member.user.fullName}
                        </p>
                        {isCurrentUser ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                            Bạn
                          </span>
                        ) : null}
                        <span className="text-xs text-slate-400">
                          · {PRESENCE_META[status].label}
                        </span>
                      </div>
                      <p className="truncate text-sm text-slate-500">
                        {member.user.email}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Tham gia{" "}
                        {dateFormatter.format(new Date(member.joinedAt))}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!isCurrentUser ? (
                      <button
                        type="button"
                        disabled={createDmMutation.isPending}
                        onClick={() => void handleStartDm(member.user.id)}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        Nhắn tin
                      </button>
                    ) : null}

                    {canChangeRole ? (
                      <SelectDropdown
                        ariaLabel="Đổi vai trò thành viên"
                        size="sm"
                        align="right"
                        value={member.role}
                        disabled={updateRoleMutation.isPending}
                        className="w-36"
                        onChange={(val) =>
                          void handleRoleChange(member.id, val as EditableRole)
                        }
                        options={[
                          { value: "ADMIN", label: "Quản trị viên" },
                          { value: "MEMBER", label: "Thành viên" },
                        ]}
                      />
                    ) : (
                      <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                        {WORKSPACE_ROLE_LABELS[member.role]}
                      </span>
                    )}

                    {canRemove ? (
                      <button
                        type="button"
                        disabled={removeMemberMutation.isPending}
                        onClick={() =>
                          void handleRemove(member.id, member.user.fullName)
                        }
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Xóa
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <InviteWorkspaceMemberModal
        open={isInviteModalOpen}
        workspace={activeWorkspace}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </>
  );
}
