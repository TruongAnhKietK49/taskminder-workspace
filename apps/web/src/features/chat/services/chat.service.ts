import { apiClient } from "@/shared/lib/api-client";
import type { ApiResponse } from "@/shared/types/api.types";
import type {
  ChatMessage,
  ConversationItem,
  MessagesPageResponse,
  PresenceStatus,
  UserPresenceItem,
} from "@/features/chat/types/chat.types";

export const chatService = {
  async listConversations(workspaceId: string) {
    const response = await apiClient.get<
      ApiResponse<{ conversations: ConversationItem[] }>
    >(`/workspaces/${workspaceId}/conversations`);

    return response.data.data.conversations;
  },

  async createDirectConversation(workspaceId: string, targetUserId: string) {
    const response = await apiClient.post<
      ApiResponse<{ conversation: ConversationItem }>
    >(`/workspaces/${workspaceId}/conversations/direct`, {
      targetUserId,
    });

    return response.data.data.conversation;
  },

  async listMessages(
    conversationId: string,
    params: { cursor?: string; limit?: number } = {},
  ) {
    const response = await apiClient.get<ApiResponse<MessagesPageResponse>>(
      `/conversations/${conversationId}/messages`,
      { params },
    );

    return response.data.data;
  },

  async sendMessage(conversationId: string, content: string) {
    const response = await apiClient.post<
      ApiResponse<{ message: ChatMessage }>
    >(`/conversations/${conversationId}/messages`, { content });

    return response.data.data.message;
  },

  async editMessage(
    conversationId: string,
    messageId: string,
    content: string,
  ) {
    const response = await apiClient.patch<
      ApiResponse<{ message: ChatMessage }>
    >(`/conversations/${conversationId}/messages/${messageId}`, { content });

    return response.data.data.message;
  },

  async deleteMessage(conversationId: string, messageId: string) {
    const response = await apiClient.delete<
      ApiResponse<{ message: ChatMessage }>
    >(`/conversations/${conversationId}/messages/${messageId}`);

    return response.data.data.message;
  },

  async markAsRead(conversationId: string) {
    const response = await apiClient.post<
      ApiResponse<{ conversationId: string; userId: string; lastReadAt: string }>
    >(`/conversations/${conversationId}/read`);

    return response.data.data;
  },

  async getMyPresence() {
    const response = await apiClient.get<
      ApiResponse<{ presence: UserPresenceItem }>
    >("/presence/me");

    return response.data.data.presence;
  },

  async updateMyPresence(status: PresenceStatus, statusMessage?: string | null) {
    const response = await apiClient.patch<
      ApiResponse<{ presence: UserPresenceItem }>
    >("/presence/me", {
      status,
      ...(statusMessage !== undefined ? { statusMessage } : {}),
    });

    return response.data.data.presence;
  },

  async getWorkspacePresence(workspaceId: string) {
    const response = await apiClient.get<
      ApiResponse<{ presences: UserPresenceItem[] }>
    >(`/workspaces/${workspaceId}/presence`);

    return response.data.data.presences;
  },
};
