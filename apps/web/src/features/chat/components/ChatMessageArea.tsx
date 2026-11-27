import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { PresenceDot } from "@/features/chat/components/PresenceDot";
import {
  getConversationDisplayName,
  getDirectPeerId,
  PRESENCE_META,
} from "@/features/chat/utils/chat-helpers";
import {
  useDeleteMessage,
  useEditMessage,
  useSendMessage,
} from "@/features/chat/hooks/useChat";
import { socketClient } from "@/features/chat/lib/socket-client";
import type {
  ChatMessage,
  ConversationItem,
  PresenceStatus,
  TypingUser,
  UserPresenceItem,
} from "@/features/chat/types/chat.types";

type ChatMessageAreaProps = {
  conversation: ConversationItem | undefined;
  messages: ChatMessage[];
  hasMore: boolean;
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  currentUserId: string | undefined;
  canModerate: boolean;
  presencesByUserId: Record<string, UserPresenceItem>;
  typingUsers: TypingUser[];
  onLoadMore: () => void;
};

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
});

export function ChatMessageArea({
  conversation,
  messages,
  hasMore,
  isLoadingMessages,
  isLoadingMore,
  currentUserId,
  canModerate,
  presencesByUserId,
  typingUsers,
  onLoadMore,
}: ChatMessageAreaProps) {
  const [draft, setDraft] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingSentRef = useRef(false);

  const sendMutation = useSendMessage(conversation?.id);
  const editMutation = useEditMessage(conversation?.id);
  const deleteMutation = useDeleteMessage(conversation?.id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.id, messages.length]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      if (conversation?.id && isTypingSentRef.current) {
        socketClient.emit("typing:stop", { conversationId: conversation.id });
        isTypingSentRef.current = false;
      }
    };
  }, [conversation?.id]);

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-semibold text-slate-900">
          Chọn một kênh hoặc cuộc trò chuyện
        </p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Trao đổi theo thời gian thực với các thành viên trong workspace và dự
          án của bạn.
        </p>
      </div>
    );
  }

  const title = getConversationDisplayName(conversation, currentUserId);
  const peerId = getDirectPeerId(conversation, currentUserId);
  const peerStatus: PresenceStatus =
    (peerId ? presencesByUserId[peerId]?.status : undefined) ?? "OFFLINE";

  function stopTyping() {
    if (!conversation) return;
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingSentRef.current) {
      socketClient.emit("typing:stop", { conversationId: conversation.id });
      isTypingSentRef.current = false;
    }
  }

  function handleDraftChange(nextValue: string) {
    setDraft(nextValue);
    if (!conversation) return;

    if (!nextValue.trim()) {
      stopTyping();
      return;
    }

    if (!isTypingSentRef.current) {
      socketClient.emit("typing:start", { conversationId: conversation.id });
      isTypingSentRef.current = true;
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      stopTyping();
    }, 2500);
  }

  async function submitMessage() {
    const trimmed = draft.trim();
    if (!trimmed || sendMutation.isPending) {
      return;
    }
    stopTyping();
    setDraft("");
    await sendMutation.mutateAsync(trimmed);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void submitMessage();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submitMessage();
    }
  }

  async function handleSaveEdit(messageId: string) {
    const trimmed = editingDraft.trim();
    if (!trimmed || editMutation.isPending) return;
    await editMutation.mutateAsync({ messageId, content: trimmed });
    setEditingMessageId(null);
    setEditingDraft("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
        <div className="flex items-center gap-3">
          {conversation.type === "DIRECT" ? (
            <PresenceDot status={peerStatus} size="md" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
              #
            </span>
          )}
          <div>
            <h3 className="text-sm font-bold text-slate-950">{title}</h3>
            <p className="text-xs text-slate-500">
              {conversation.type === "DIRECT"
                ? PRESENCE_META[peerStatus].label
                : conversation.type === "WORKSPACE"
                  ? "Kênh chung toàn workspace"
                  : "Kênh thảo luận dự án"}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {hasMore ? (
          <div className="text-center">
            <button
              type="button"
              disabled={isLoadingMore}
              onClick={onLoadMore}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {isLoadingMore ? "Đang tải..." : "Tải thêm tin nhắn cũ"}
            </button>
          </div>
        ) : null}

        {isLoadingMessages ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            const isDeleted = Boolean(msg.deletedAt);
            const senderStatus: PresenceStatus =
              presencesByUserId[msg.senderId]?.status ?? "OFFLINE";
            const isEditing = editingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={[
                  "group flex items-start gap-3",
                  isMine ? "flex-row-reverse" : "",
                ].join(" ")}
              >
                <div className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {msg.sender.fullName.charAt(0).toUpperCase()}
                  <PresenceDot
                    status={senderStatus}
                    className="absolute -bottom-0.5 -right-0.5"
                  />
                </div>

                <div
                  className={[
                    "max-w-[75%] space-y-1",
                    isMine ? "items-end text-right" : "",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex items-center gap-2 text-xs text-slate-400",
                      isMine ? "justify-end" : "",
                    ].join(" ")}
                  >
                    <span className="font-semibold text-slate-700">
                      {msg.sender.fullName}
                    </span>
                    <span>{timeFormatter.format(new Date(msg.createdAt))}</span>
                    {msg.editedAt && !isDeleted ? (
                      <span className="italic">(đã sửa)</span>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <div className="flex flex-col gap-2 rounded-2xl border border-blue-300 bg-slate-50 p-2.5 text-left">
                      <input
                        type="text"
                        value={editingDraft}
                        onChange={(e) => setEditingDraft(e.target.value)}
                        className="w-64 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditingDraft("");
                          }}
                          className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          disabled={editMutation.isPending}
                          onClick={() => void handleSaveEdit(msg.id)}
                          className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={[
                        "inline-block rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed",
                        isDeleted
                          ? "border border-slate-200 bg-slate-50 italic text-slate-400"
                          : isMine
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-900",
                      ].join(" ")}
                    >
                      {isDeleted ? (
                        "Tin nhắn đã bị xóa"
                      ) : (
                        <span className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </span>
                      )}
                    </div>
                  )}

                  {!isDeleted && !isEditing && (isMine || canModerate) ? (
                    <div
                      className={[
                        "flex gap-2 text-[11px] opacity-0 transition group-hover:opacity-100",
                        isMine ? "justify-end" : "",
                      ].join(" ")}
                    >
                      {isMine ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMessageId(msg.id);
                            setEditingDraft(msg.content);
                          }}
                          className="font-medium text-slate-500 hover:text-blue-600"
                        >
                          Sửa
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(msg.id)}
                        className="font-medium text-slate-500 hover:text-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>

      {typingUsers.length > 0 ? (
        <div className="px-5 pb-1 text-xs italic text-slate-500">
          {typingUsers.map((u) => u.fullName).join(", ")} đang nhập...
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-3 border-t border-slate-200 p-4"
      >
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Nhắn tin tới ${title}... (Enter để gửi, Shift+Enter xuống dòng)`}
          className="max-h-32 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-950 outline-none focus:border-blue-500 focus:bg-white"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sendMutation.isPending}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sendMutation.isPending ? "Đang gửi..." : "Gửi"}
        </button>
      </form>
    </div>
  );
}
