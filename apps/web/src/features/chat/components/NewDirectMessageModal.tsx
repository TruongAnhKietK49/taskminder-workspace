import { useMemo, useState } from "react";

import { PresenceDot } from "@/features/chat/components/PresenceDot";
import { PRESENCE_META } from "@/features/chat/utils/chat-helpers";
import type {
  PresenceStatus,
  UserPresenceItem,
} from "@/features/chat/types/chat.types";
import { useWorkspaceMembersQuery } from "@/features/workspaces/hooks/useWorkspaceMembers";

type NewDirectMessageModalProps = {
  open: boolean;
  workspaceId: string | undefined;
  currentUserId: string | undefined;
  presencesByUserId: Record<string, UserPresenceItem>;
  isPending: boolean;
  onClose: () => void;
  onSelectUser: (targetUserId: string) => void;
};

export function NewDirectMessageModal({
  open,
  workspaceId,
  currentUserId,
  presencesByUserId,
  isPending,
  onClose,
  onSelectUser,
}: NewDirectMessageModalProps) {
  const [search, setSearch] = useState("");
  const membersQuery = useWorkspaceMembersQuery(workspaceId);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (membersQuery.data ?? [])
      .filter((member) => member.user.id !== currentUserId)
      .filter((member) => {
        if (!q) return true;
        return (
          member.user.fullName.toLowerCase().includes(q) ||
          member.user.email.toLowerCase().includes(q)
        );
      });
  }, [membersQuery.data, currentUserId, search]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-950">
            Tin nhắn trực tiếp mới
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc email thành viên..."
          className="mt-3 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
        />

        <div className="mt-3 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">
          {membersQuery.isLoading ? (
            <p className="p-4 text-center text-xs text-slate-500">
              Đang tải thành viên...
            </p>
          ) : filteredMembers.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-500">
              Không tìm thấy thành viên nào khác trong workspace.
            </p>
          ) : (
            filteredMembers.map((member) => {
              const status: PresenceStatus =
                presencesByUserId[member.user.id]?.status ?? "OFFLINE";

              return (
                <button
                  key={member.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => onSelectUser(member.user.id)}
                  className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      {member.user.fullName.charAt(0).toUpperCase()}
                      <PresenceDot
                        status={status}
                        className="absolute -bottom-0.5 -right-0.5"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {member.user.fullName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {PRESENCE_META[status].label}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
