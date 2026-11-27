import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/features/chat/services/chat.service";
import { useRealtimeStore } from "@/features/chat/stores/realtime.store";
import type {
  ChatMessage,
  ConversationItem,
  MessagesPageResponse,
  PresenceStatus,
} from "@/features/chat/types/chat.types";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { toast } from "@/shared/stores/toast.store";

const CONVERSATIONS_KEY = ["chat-conversations"] as const;
const MESSAGES_KEY = ["chat-messages"] as const;

export const chatQueryKeys = {
  allConversations: CONVERSATIONS_KEY,
  conversations: (workspaceId: string) =>
    [...CONVERSATIONS_KEY, workspaceId] as const,
  messages: (conversationId: string) =>
    [...MESSAGES_KEY, conversationId] as const,
};

export function useConversationsQuery(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceId
      ? chatQueryKeys.conversations(workspaceId)
      : chatQueryKeys.allConversations,
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required");
      }
      return chatService.listConversations(workspaceId);
    },
    enabled: Boolean(workspaceId),
  });
}

export function useMessagesQuery(conversationId: string | undefined) {
  return useQuery({
    queryKey: conversationId
      ? chatQueryKeys.messages(conversationId)
      : MESSAGES_KEY,
    queryFn: () => {
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }
      return chatService.listMessages(conversationId);
    },
    enabled: Boolean(conversationId),
  });
}

export function useCreateDirectConversation(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: string) => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required");
      }
      return chatService.createDirectConversation(workspaceId, targetUserId);
    },
    onSuccess: (conversation) => {
      if (workspaceId) {
        queryClient.setQueryData<ConversationItem[]>(
          chatQueryKeys.conversations(workspaceId),
          (current = []) => {
            const exists = current.some((item) => item.id === conversation.id);
            return exists ? current : [conversation, ...current];
          },
        );
      }
      toast.success("Đã mở cuộc trò chuyện!");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Không thể tạo cuộc trò chuyện."));
    },
  });
}

export function useSendMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => {
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }
      return chatService.sendMessage(conversationId, content);
    },
    onSuccess: (message) => {
      if (!conversationId) return;
      queryClient.setQueryData<MessagesPageResponse>(
        chatQueryKeys.messages(conversationId),
        (current) => {
          if (!current) {
            return { messages: [message], hasMore: false, nextCursor: null };
          }
          const exists = current.messages.some((m) => m.id === message.id);
          if (exists) return current;
          return {
            ...current,
            messages: [...current.messages, message],
          };
        },
      );
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Không thể gửi tin nhắn."));
    },
  });
}

export function useEditMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => {
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }
      return chatService.editMessage(conversationId, messageId, content);
    },
    onSuccess: (updated: ChatMessage) => {
      if (!conversationId) return;
      queryClient.setQueryData<MessagesPageResponse>(
        chatQueryKeys.messages(conversationId),
        (current) => {
          if (!current) return current;
          return {
            ...current,
            messages: current.messages.map((m) =>
              m.id === updated.id ? updated : m,
            ),
          };
        },
      );
      toast.success("Đã cập nhật tin nhắn!");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Không thể sửa tin nhắn."));
    },
  });
}

export function useDeleteMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => {
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }
      return chatService.deleteMessage(conversationId, messageId);
    },
    onSuccess: (deleted: ChatMessage) => {
      if (!conversationId) return;
      queryClient.setQueryData<MessagesPageResponse>(
        chatQueryKeys.messages(conversationId),
        (current) => {
          if (!current) return current;
          return {
            ...current,
            messages: current.messages.map((m) =>
              m.id === deleted.id ? deleted : m,
            ),
          };
        },
      );
      toast.info("Đã xóa tin nhắn.");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Không thể xóa tin nhắn."));
    },
  });
}

export function useMarkConversationRead(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      chatService.markAsRead(conversationId),
    onSuccess: (result) => {
      if (!workspaceId) return;
      queryClient.setQueryData<ConversationItem[]>(
        chatQueryKeys.conversations(workspaceId),
        (current) =>
          current?.map((item) =>
            item.id === result.conversationId
              ? { ...item, unreadCount: 0 }
              : item,
          ),
      );
    },
  });
}

export function useUpdateMyPresence() {
  const upsertPresence = useRealtimeStore((state) => state.upsertPresence);

  return useMutation({
    mutationFn: ({
      status,
      statusMessage,
    }: {
      status: PresenceStatus;
      statusMessage?: string | null;
    }) => chatService.updateMyPresence(status, statusMessage),
    onSuccess: (presence) => {
      upsertPresence(presence);
      toast.success("Đã cập nhật trạng thái hoạt động!");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Không thể cập nhật trạng thái."));
    },
  });
}
