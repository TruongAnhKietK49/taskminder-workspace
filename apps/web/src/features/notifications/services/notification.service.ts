import { apiClient } from "@/shared/lib/api-client";
import type { ApiResponse } from "@/shared/types/api.types";
import type {
  NotificationItem,
  NotificationSettings,
  QueryNotificationsParams,
  UpdateNotificationSettingsPayload,
} from "@/features/notifications/types/notification.types";

type NotificationsListResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export const notificationService = {
  async getAll(params?: QueryNotificationsParams) {
    const cleaned: Record<string, string> = {};
    if (params?.filter) {
      cleaned.filter = params.filter;
    }
    if (params?.type) {
      cleaned.type = params.type;
    }

    const response = await apiClient.get<ApiResponse<NotificationsListResponse>>(
      "/notifications",
      { params: cleaned },
    );

    return response.data.data;
  },

  async getUnreadCount() {
    const response = await apiClient.get<ApiResponse<{ unreadCount: number }>>(
      "/notifications/unread-count",
    );

    return response.data.data.unreadCount;
  },

  async markAsRead(notificationId: string) {
    const response = await apiClient.patch<
      ApiResponse<{ notification: NotificationItem }>
    >(`/notifications/${notificationId}/read`);

    return response.data.data.notification;
  },

  async markAllAsRead() {
    const response = await apiClient.patch<
      ApiResponse<{ updatedCount: number }>
    >("/notifications/read-all");

    return response.data.data.updatedCount;
  },

  async remove(notificationId: string) {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  async getSettings() {
    const response = await apiClient.get<
      ApiResponse<{ settings: NotificationSettings }>
    >("/notification-settings");

    return response.data.data.settings;
  },

  async updateSettings(payload: UpdateNotificationSettingsPayload) {
    const response = await apiClient.patch<
      ApiResponse<{ settings: NotificationSettings }>
    >("/notification-settings", payload);

    return response.data.data.settings;
  },
};
