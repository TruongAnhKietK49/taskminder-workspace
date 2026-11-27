import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationService } from "@/features/notifications/services/notification.service";
import type {
  QueryNotificationsParams,
  UpdateNotificationSettingsPayload,
} from "@/features/notifications/types/notification.types";
import { toast } from "@/shared/stores/toast.store";

const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
const NOTIFICATION_SETTINGS_QUERY_KEY = ["notification-settings"] as const;

export const notificationQueryKeys = {
  all: NOTIFICATIONS_QUERY_KEY,
  list: (params: QueryNotificationsParams = {}) =>
    [...NOTIFICATIONS_QUERY_KEY, "list", params] as const,
  unreadCount: () => [...NOTIFICATIONS_QUERY_KEY, "unread-count"] as const,
  settings: NOTIFICATION_SETTINGS_QUERY_KEY,
};

export function useNotificationsQuery(params: QueryNotificationsParams = {}) {
  return useQuery({
    queryKey: notificationQueryKeys.list(params),
    queryFn: () => notificationService.getAll(params),
  });
}

export function useUnreadNotificationCountQuery() {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc.");
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.remove,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
      toast.info("Đã xóa thông báo.");
    },
  });
}

export function useNotificationSettingsQuery() {
  return useQuery({
    queryKey: notificationQueryKeys.settings,
    queryFn: notificationService.getSettings,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateNotificationSettingsPayload) =>
      notificationService.updateSettings(payload),
    onSuccess: (settings) => {
      queryClient.setQueryData(notificationQueryKeys.settings, settings);
      toast.success("Đã lưu cài đặt thông báo!");
    },
  });
}
