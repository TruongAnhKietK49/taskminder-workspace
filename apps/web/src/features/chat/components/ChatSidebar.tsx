import { useMemo, useState } from "react";

import { PresenceDot } from "@/features/chat/components/PresenceDot";
import type { SocketConnectionStatus } from "@/features/chat/stores/realtime.store";
import type {
  ConversationItem,
  PresenceStatus,
  UserPresenceItem,
} from "@/features/chat/types/chat.types";
import {
  getConversationDisplayName,
  getDirectPeerId,
} from "@/features/chat/utils/chat-helpers";

type ChatSidebarProps = {
  conversations: ConversationItem[];
  selectedConversationId: string | null;
  currentUserId: string | undefined;
  presencesByUserId: Record<string, UserPresenceItem>;
  connectionStatus: SocketConnectionStatus;
  onSelectConversation: (conversationId: string) => void;
  onOpenNewDm: () => void;
};

export function ChatSidebar({
  conversations,
  selectedConversationId,
  currentUserId,
  presencesByUserId,
  connectionStatus,
  onSelectConversation,
  onOpenNewDm,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { channels, directMessages } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = conversations.filter((conv) => {
      if (!q) return true;
      return getConversationDisplayName(conv, currentUserId)
        .toLowerCase()
        .includes(q);
    });

    return {
      channels: filtered.filter((conv) => conv.type !== "DIRECT"),
      directMessages: filtered.filter((conv) => conv.type === "DIRECT"),
    };
  }, [conversations, currentUserId, searchQuery]);

  return (
    <aside className="flex w-full flex-col border-b border-slate-200 bg-slate-50/70 md:w-72 md:border-b-0 md:border-r lg:w-80">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-950">Kênh & Chat</h2>
            <span
              className={[
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                connectionStatus === "connected"
                  ? "bg-emerald-100 text-emerald-700"
                  : connectionStatus === "connecting"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-200 text-slate-600",
              ].join(" ")}
            >
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  connectionStatus === "connected"
                    ? "bg-emerald-500"
                    : connectionStatus === "connecting"
                      ? "bg-amber-500"
                      : "bg-slate-400",
                ].join(" ")}
              />
              {connectionStatus === "connected"
                ? "Realtime"
                : connectionStatus === "connecting"
                  ? "Đang kết nối"
                  : "Ngoại tuyến"}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenNewDm}
            className="rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            + Nhắn mới
          </button>
        </div>

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kênh hoặc thành viên..."
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-3">
        <div>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Kênh dự án & Workspace
          </p>
          <div className="mt-1.5 space-y-1">
            {channels.length === 0 ? (
              <p className="px-2 py-2 text-xs text-slate-400">
                Không có kênh phù hợp.
              </p>
            ) : (
              channels.map((conv) => {
                const isActive = conv.id === selectedConversationId;
                const label = getConversationDisplayName(conv, currentUserId);
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => onSelectConversation(conv.id)}
                    className={[
                      "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                      isActive
                        ? "bg-slate-900 font-semibold text-white"
                        : "text-slate-700 hover:bg-white",
                    ].join(" ")}
                  >
                    <span className="truncate">{label}</span>
                    {conv.unreadCount > 0 ? (
                      <span className="shrink-0 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between px-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Tin nhắn trực tiếp
            </p>
            <button
              type="button"
              onClick={onOpenNewDm}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              + DM
            </button>
          </div>

          <div className="mt-1.5 space-y-1">
            {directMessages.length === 0 ? (
              <p className="px-2 py-2 text-xs text-slate-400">
                Chưa có cuộc trò chuyện riêng nào.
              </p>
            ) : (
              directMessages.map((conv) => {
                const isActive = conv.id === selectedConversationId;
                const label = getConversationDisplayName(conv, currentUserId);
                const peerId = getDirectPeerId(conv, currentUserId);
                const peerStatus: PresenceStatus =
                  (peerId ? presencesByUserId[peerId]?.status : undefined) ??
                  "OFFLINE";

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => onSelectConversation(conv.id)}
                    className={[
                      "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                      isActive
                        ? "bg-slate-900 font-semibold text-white"
                        : "text-slate-700 hover:bg-white",
                    ].join(" ")}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <PresenceDot status={peerStatus} />
                      <div className="min-w-0">
                        <p className="truncate text-sm">{label}</p>
                        {conv.lastMessage && !conv.lastMessage.deletedAt ? (
                          <p
                            className={[
                              "truncate text-[11px]",
                              isActive ? "text-slate-300" : "text-slate-400",
                            ].join(" ")}
                          >
                            {conv.lastMessage.content}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {conv.unreadCount > 0 ? (
                      <span className="shrink-0 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
