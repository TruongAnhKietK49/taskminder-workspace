import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
} from "@/features/notifications/hooks/useNotifications";
import type { NotificationItem } from "@/features/notifications/types/notification.types";

function getNotificationTarget(item: NotificationItem): string {
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
  return ROUTE_PATHS.NOTIFICATIONS;
}

export function NotificationBellDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const unreadCountQuery = useUnreadNotificationCountQuery();
  const notificationsQuery = useNotificationsQuery({});
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const unreadCount = unreadCountQuery.data ?? 0;
  const notifications = notificationsQuery.data?.notifications.slice(0, 6) ?? [];

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleSelectNotification(item: NotificationItem) {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
    setOpen(false);
    navigate(getNotificationTarget(item));
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Notifications
              </p>
              <p className="text-xs text-slate-500">{unreadCount} unread</p>
            </div>

            {unreadCount > 0 ? (
              <button
                type="button"
                disabled={markAllReadMutation.isPending}
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {notificationsQuery.isLoading ? (
              <p className="px-4 py-6 text-center text-xs text-slate-500">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-500">
                You are all caught up!
              </p>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectNotification(item)}
                  className={[
                    "flex w-full items-start gap-2.5 px-4 py-3 text-left transition hover:bg-slate-50",
                    !item.isRead ? "bg-blue-50/40 dark:bg-blue-950/20" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      item.isRead ? "bg-transparent" : "bg-blue-600",
                    ].join(" ")}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-950">
                      {item.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                      {item.message}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2.5 text-center">
            <Link
              to={ROUTE_PATHS.NOTIFICATIONS}
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
