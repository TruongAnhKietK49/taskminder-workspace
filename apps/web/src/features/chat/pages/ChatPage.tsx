import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { useAuthStore } from "@/features/auth/stores/auth.store";
import { ChatMessageArea } from "@/features/chat/components/ChatMessageArea";
import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { NewDirectMessageModal } from "@/features/chat/components/NewDirectMessageModal";
import {
  chatQueryKeys,
  useConversationsQuery,
  useCreateDirectConversation,
  useMarkConversationRead,
  useMessagesQuery,
} from "@/features/chat/hooks/useChat";
import { socketClient } from "@/features/chat/lib/socket-client";
import { chatService } from "@/features/chat/services/chat.service";
import { useRealtimeStore } from "@/features/chat/stores/realtime.store";
import type { MessagesPageResponse } from "@/features/chat/types/chat.types";
import { useWorkspaceSelection } from "@/features/workspaces/hooks/useWorkspaceSelection";

export function ChatPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialConversationId = searchParams.get("conversationId");
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { activeWorkspace, activeWorkspaceId } = useWorkspaceSelection();

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(initialConversationId);
  const [isNewDmOpen, setIsNewDmOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const connectionStatus = useRealtimeStore((state) => state.connectionStatus);
  const presencesByUserId = useRealtimeStore(
    (state) => state.presencesByUserId,
  );
  const typingByConversationId = useRealtimeStore(
    (state) => state.typingByConversationId,
  );
  const setActiveConversationId = useRealtimeStore(
    (state) => state.setActiveConversationId,
  );

  const conversationsQuery = useConversationsQuery(activeWorkspaceId);
  const conversations = conversationsQuery.data ?? [];

  const resolvedConversationId =
    selectedConversationId &&
    conversations.some((item) => item.id === selectedConversationId)
      ? selectedConversationId
      : (conversations[0]?.id ?? null);

  const activeConversation = conversations.find(
    (item) => item.id === resolvedConversationId,
  );

  const messagesQuery = useMessagesQuery(resolvedConversationId ?? undefined);
  const createDmMutation = useCreateDirectConversation(activeWorkspaceId);
  const { mutate: markConversationRead } =
    useMarkConversationRead(activeWorkspaceId);

  useEffect(() => {
    setActiveConversationId(resolvedConversationId);
    return () => {
      setActiveConversationId(null);
    };
  }, [resolvedConversationId, setActiveConversationId]);

  useEffect(() => {
    if (!resolvedConversationId) {
      return;
    }

    if (socketClient.connected) {
      socketClient.emit("conversation:join", {
        conversationId: resolvedConversationId,
      });
    }

    markConversationRead(resolvedConversationId);

    return () => {
      if (socketClient.connected) {
        socketClient.emit("conversation:leave", {
          conversationId: resolvedConversationId,
        });
      }
    };
  }, [resolvedConversationId, markConversationRead]);

  async function handleLoadMore() {
    if (
      !resolvedConversationId ||
      !messagesQuery.data?.nextCursor ||
      isLoadingMore
    ) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const older = await chatService.listMessages(resolvedConversationId, {
        cursor: messagesQuery.data.nextCursor,
      });

      queryClient.setQueryData<MessagesPageResponse>(
        chatQueryKeys.messages(resolvedConversationId),
        (current) => {
          if (!current) return older;
          const existingIds = new Set(current.messages.map((m) => m.id));
          const uniqueOlder = older.messages.filter(
            (m) => !existingIds.has(m.id),
          );
          return {
            messages: [...uniqueOlder, ...current.messages],
            hasMore: older.hasMore,
            nextCursor: older.nextCursor,
          };
        },
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleSelectDmUser(targetUserId: string) {
    const conv = await createDmMutation.mutateAsync(targetUserId);
    setSelectedConversationId(conv.id);
    setIsNewDmOpen(false);
  }

  if (!activeWorkspaceId) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-950">
          Chưa chọn Workspace
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Hãy chọn hoặc tạo một workspace để sử dụng tính năng chat realtime.
        </p>
      </section>
    );
  }

  const canModerate =
    activeWorkspace?.currentUserRole === "OWNER" ||
    activeWorkspace?.currentUserRole === "ADMIN";

  return (
    <>
      <section className="flex h-[calc(100vh-5.75rem)] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:flex-row">
        <ChatSidebar
          conversations={conversations}
          selectedConversationId={resolvedConversationId}
          currentUserId={currentUserId}
          presencesByUserId={presencesByUserId}
          connectionStatus={connectionStatus}
          onSelectConversation={(id) => setSelectedConversationId(id)}
          onOpenNewDm={() => setIsNewDmOpen(true)}
        />

        <ChatMessageArea
          conversation={activeConversation}
          messages={messagesQuery.data?.messages ?? []}
          hasMore={messagesQuery.data?.hasMore ?? false}
          isLoadingMessages={messagesQuery.isLoading}
          isLoadingMore={isLoadingMore}
          currentUserId={currentUserId}
          canModerate={canModerate}
          presencesByUserId={presencesByUserId}
          typingUsers={
            resolvedConversationId
              ? (typingByConversationId[resolvedConversationId] ?? [])
              : []
          }
          onLoadMore={() => void handleLoadMore()}
        />
      </section>

      <NewDirectMessageModal
        open={isNewDmOpen}
        workspaceId={activeWorkspaceId}
        currentUserId={currentUserId}
        presencesByUserId={presencesByUserId}
        isPending={createDmMutation.isPending}
        onClose={() => setIsNewDmOpen(false)}
        onSelectUser={(targetId) => void handleSelectDmUser(targetId)}
      />
    </>
  );
}
