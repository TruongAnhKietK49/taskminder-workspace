import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsQuery,
} from "@/features/notifications/hooks/useNotifications";
import type {
  NotificationItem,
  NotificationType,
} from "@/features/notifications/types/notification.types";
import { SelectDropdown } from "@/shared/components/SelectDropdown";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

const NOTIFICATION_TYPE_OPTIONS: Array<{
  value: "" | NotificationType;
  label: string;
}> = [
  { value: "", label: "All types" },
  { value: "TASK_ASSIGNED", label: "Task assigned" },
  { value: "TASK_UPDATED", label: "Task updated" },
  { value: "TASK_DUE_SOON", label: "Due soon / Reminder" },
  { value: "TASK_OVERDUE", label: "Overdue" },
  { value: "MENTION", label: "Mentions" },
  { value: "WORKSPACE_INVITATION", label: "Invitations" },
];

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function getNotificationLink(item: NotificationItem): string | null {
  const meta = item.metadata ?? {};
  if (
    item.type === "WORKSPACE_INVITATION" &&
    typeof meta.token === "string" &&
    meta.token
  ) {
    return `/workspace-invitations/${meta.token}`;
  }
  if (typeof meta.projectId === "string" && meta.projectId) {
    return `${ROUTE_PATHS.TASKS}?projectId=${meta.projectId}`;
  }
  return null;
}

export function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<"" | NotificationType>("");

  const queryParams = useMemo(
    () => ({
      filter,
      type: typeFilter || undefined,
    }),
    [filter, typeFilter],
  );

  const notificationsQuery = useNotificationsQuery(queryParams);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-5 py-4 text-white shadow-md shadow-blue-500/15 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-100">
            Notification Center
          </p>
          <h1 className="mt-1 text-xl font-bold md:text-2xl">Thông báo</h1>
          <p className="mt-1 max-w-2xl text-xs text-blue-50 md:text-sm">
            Theo dõi thông báo giao việc, nhắc hạn deadline, @mentions và lời
            mời tham gia workspace ({unreadCount} chưa đọc).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {unreadCount > 0 ? (
            <button
              type="button"
              disabled={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
              className="rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-xs hover:bg-sky-50"
            >
              Đánh dấu đã đọc tất cả
            </button>
          ) : null}

          <Link
            to={ROUTE_PATHS.SETTINGS}
            className="rounded-xl border border-white/25 bg-white/15 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/25"
          >
            Cài đặt thông báo
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={[
              "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
              filter === "all"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-600 hover:text-slate-950",
            ].join(" ")}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={[
              "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
              filter === "unread"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-600 hover:text-slate-950",
            ].join(" ")}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <SelectDropdown
          ariaLabel="Filter notification type"
          align="right"
          value={typeFilter}
          className="w-52"
          onChange={(val) => setTypeFilter(val as "" | NotificationType)}
          options={NOTIFICATION_TYPE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
      </div>

      {notificationsQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : notificationsQuery.isError ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-semibold text-red-800">
            {getApiErrorMessage(notificationsQuery.error)}
          </p>
        </section>
      ) : notifications.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            Không có thông báo nào
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Các cập nhật mới về task, reminder và lời mời sẽ xuất hiện tại đây.
          </p>
        </section>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {notifications.map((item) => {
            const targetLink = getNotificationLink(item);

            return (
              <article
                key={item.id}
                className={[
                  "flex flex-wrap items-start justify-between gap-4 p-4 transition",
                  !item.isRead ? "bg-blue-50/40 dark:bg-blue-950/20" : "",
                ].join(" ")}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span
                    className={[
                      "mt-2 h-2.5 w-2.5 shrink-0 rounded-full",
                      item.isRead ? "bg-slate-300" : "bg-blue-600",
                    ].join(" ")}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {item.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>

                    <h3 className="mt-1 text-sm font-semibold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {item.message}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {targetLink ? (
                    <Link
                      to={targetLink}
                      onClick={() => {
                        if (!item.isRead) {
                          markReadMutation.mutate(item.id);
                        }
                      }}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Open
                    </Link>
                  ) : null}

                  {!item.isRead ? (
                    <button
                      type="button"
                      onClick={() => markReadMutation.mutate(item.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Mark read
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
