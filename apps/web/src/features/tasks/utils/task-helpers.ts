import type { Task, TaskStatus } from "@/features/tasks/types/task.types";
import type { WorkspaceRole } from "@/features/workspaces/types/workspace.types";

export function canUserEditTask(
  task: Task,
  currentUserId: string | null | undefined,
  workspaceRole: WorkspaceRole | undefined,
): boolean {
  if (workspaceRole === "OWNER" || workspaceRole === "ADMIN") {
    return true;
  }

  if (!currentUserId) {
    return false;
  }

  return task.createdById === currentUserId || task.assigneeId === currentUserId;
}

export function getDueDateStatus(
  dueDate: string | null,
  status: TaskStatus,
): "overdue" | "soon" | "normal" | "none" {
  if (!dueDate || status === "DONE" || status === "ARCHIVED") {
    return "none";
  }

  const dueTime = Date.parse(dueDate);
  if (Number.isNaN(dueTime)) {
    return "none";
  }

  const now = Date.now();
  if (dueTime < now) {
    return "overdue";
  }

  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  if (dueTime <= now + threeDaysMs) {
    return "soon";
  }

  return "normal";
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
