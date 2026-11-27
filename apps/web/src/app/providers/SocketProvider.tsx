import { type PropsWithChildren, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { chatQueryKeys } from "@/features/chat/hooks/useChat";
import { socketClient } from "@/features/chat/lib/socket-client";
import { chatService } from "@/features/chat/services/chat.service";
import { useRealtimeStore } from "@/features/chat/stores/realtime.store";
import type {
  ChatMessage,
  ConversationItem,
  MessagesPageResponse,
  UserPresenceItem,
} from "@/features/chat/types/chat.types";
import { useWorkspaceStore } from "@/features/workspaces/stores/workspace.store";

type ConversationActivityPayload = {
  workspaceId: string;
  conversationId: string;
  message: ChatMessage;
};

type TypingUpdatedPayload = {
  conversationId: string;
  userId: string;
  fullName: string;
  isTyping: boolean;
};

export function SocketProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const authStatus = useAuthStore((state) => state.status);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const activeWorkspaceId = useWorkspaceStore(
    (state) => state.activeWorkspaceId,
  );

  const setConnectionStatus = useRealtimeStore(
    (state) => state.setConnectionStatus,
  );
  const setMyPresence = useRealtimeStore((state) => state.setMyPresence);
  const upsertPresence = useRealtimeStore((state) => state.upsertPresence);
  const setWorkspacePresences = useRealtimeStore(
    (state) => state.setWorkspacePresences,
  );
  const setTypingUser = useRealtimeStore((state) => state.setTypingUser);
  const reset = useRealtimeStore((state) => state.reset);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      if (socketClient.connected) {
        socketClient.disconnect();
      }
      reset();
      return;
    }

    function handleConnect() {
      setConnectionStatus("connected");
      void chatService
        .getMyPresence()
        .then((presence) => setMyPresence(presence))
        .catch(() => undefined);

      const wsId = useWorkspaceStore.getState().activeWorkspaceId;
      if (wsId) {
        socketClient.emit("workspace:join", { workspaceId: wsId });
        void chatService
          .getWorkspacePresence(wsId)
          .then((list) => setWorkspacePresences(list))
          .catch(() => undefined);
      }
    }

    function handleDisconnect() {
      setConnectionStatus("disconnected");
    }

    function handlePresenceUpdated(snapshot: UserPresenceItem) {
      upsertPresence(snapshot);
    }

    function handleMessageNew(message: ChatMessage) {
      queryClient.setQueryData<MessagesPageResponse>(
        chatQueryKeys.messages(message.conversationId),
        (current) => {
          if (!current) return current;
          if (current.messages.some((m) => m.id === message.id)) {
            return current;
          }
          return {
            ...current,
            messages: [...current.messages, message],
          };
        },
      );
    }

    function handleMessageUpdatedOrDeleted(message: ChatMessage) {
      queryClient.setQueryData<MessagesPageResponse>(
        chatQueryKeys.messages(message.conversationId),
        (current) => {
          if (!current) return current;
          return {
            ...current,
            messages: current.messages.map((m) =>
              m.id === message.id ? message : m,
            ),
          };
        },
      );

      const wsId = useWorkspaceStore.getState().activeWorkspaceId;
      if (wsId) {
        queryClient.setQueryData<ConversationItem[]>(
          chatQueryKeys.conversations(wsId),
          (current) =>
            current?.map((conv) =>
              conv.id === message.conversationId &&
              conv.lastMessage?.id === message.id
                ? {
                    ...conv,
                    lastMessage: message.deletedAt ? null : message,
                  }
                : conv,
            ),
        );
      }
    }

    function handleConversationActivity(payload: ConversationActivityPayload) {
      const activeConvId = useRealtimeStore.getState().activeConversationId;
      const isMine = payload.message.senderId === currentUserId;
      const isViewing = activeConvId === payload.conversationId;

      let foundInCache = false;
      queryClient.setQueryData<ConversationItem[]>(
        chatQueryKeys.conversations(payload.workspaceId),
        (current) => {
          if (!current) return current;
          return current.map((conv) => {
            if (conv.id !== payload.conversationId) {
              return conv;
            }
            foundInCache = true;
            return {
              ...conv,
              lastMessage: payload.message,
              lastMessageAt: payload.message.createdAt,
              unreadCount:
                isMine || isViewing ? conv.unreadCount : conv.unreadCount + 1,
            };
          });
        },
      );

      if (!foundInCache) {
        void queryClient.invalidateQueries({
          queryKey: chatQueryKeys.conversations(payload.workspaceId),
        });
      }
    }

    function handleTypingUpdated(payload: TypingUpdatedPayload) {
      if (payload.userId === currentUserId) {
        return;
      }
      setTypingUser(
        payload.conversationId,
        { userId: payload.userId, fullName: payload.fullName },
        payload.isTyping,
      );
    }

    socketClient.on("connect", handleConnect);
    socketClient.on("disconnect", handleDisconnect);
    socketClient.on("presence:updated", handlePresenceUpdated);
    socketClient.on("message:new", handleMessageNew);
    socketClient.on("message:updated", handleMessageUpdatedOrDeleted);
    socketClient.on("message:deleted", handleMessageUpdatedOrDeleted);
    socketClient.on("conversation:activity", handleConversationActivity);
    socketClient.on("typing:updated", handleTypingUpdated);

    setConnectionStatus("connecting");
    socketClient.connect();

    return () => {
      socketClient.off("connect", handleConnect);
      socketClient.off("disconnect", handleDisconnect);
      socketClient.off("presence:updated", handlePresenceUpdated);
      socketClient.off("message:new", handleMessageNew);
      socketClient.off("message:updated", handleMessageUpdatedOrDeleted);
      socketClient.off("message:deleted", handleMessageUpdatedOrDeleted);
      socketClient.off("conversation:activity", handleConversationActivity);
      socketClient.off("typing:updated", handleTypingUpdated);
      socketClient.disconnect();
    };
  }, [
    authStatus,
    currentUserId,
    queryClient,
    reset,
    setConnectionStatus,
    setMyPresence,
    setTypingUser,
    setWorkspacePresences,
    upsertPresence,
  ]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !activeWorkspaceId) {
      return;
    }

    if (socketClient.connected) {
      socketClient.emit("workspace:join", { workspaceId: activeWorkspaceId });
    }

    void chatService
      .getWorkspacePresence(activeWorkspaceId)
      .then((list) => setWorkspacePresences(list))
      .catch(() => undefined);
  }, [authStatus, activeWorkspaceId, setWorkspacePresences]);

  return children;
}
