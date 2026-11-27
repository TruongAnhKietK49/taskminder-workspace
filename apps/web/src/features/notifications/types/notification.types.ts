export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_UPDATED"
  | "TASK_DUE_SOON"
  | "TASK_OVERDUE"
  | "PROJECT_INVITATION"
  | "WORKSPACE_INVITATION"
  | "MENTION"
  | "CHAT_MESSAGE"
  | "SYSTEM";

export type NotificationItem = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type NotificationSettings = {
  id: string;
  userId: string;
  taskUpdatesEnabled: boolean;
  remindersEnabled: boolean;
  chatEnabled: boolean;
  emailEnabled: boolean;
  doNotDisturb: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  mutedProjectIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type UpdateNotificationSettingsPayload = Partial<{
  taskUpdatesEnabled: boolean;
  remindersEnabled: boolean;
  chatEnabled: boolean;
  emailEnabled: boolean;
  doNotDisturb: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  mutedProjectIds: string[];
}>;

export type QueryNotificationsParams = {
  filter?: "all" | "unread";
  type?: NotificationType;
};
