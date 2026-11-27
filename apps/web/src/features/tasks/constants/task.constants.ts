import type {
  ActiveTaskStatus,
  TaskPriority,
  TaskSortField,
  TaskSortOrder,
  TaskStatus,
} from "@/features/tasks/types/task.types";

export const TASK_TITLE_MAX_LENGTH = 160;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;

export const BOARD_TASK_STATUSES: ActiveTaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "BLOCKED",
  "DONE",
];

export const TASK_STATUS_OPTIONS: Array<{
  value: TaskStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
  columnBorderClass: string;
}> = [
  {
    value: "TODO",
    label: "To Do",
    badgeClass: "bg-slate-100 text-slate-700 ring-slate-200",
    dotClass: "bg-slate-400",
    columnBorderClass: "border-t-slate-400",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    badgeClass: "bg-blue-50 text-blue-700 ring-blue-200",
    dotClass: "bg-blue-500",
    columnBorderClass: "border-t-blue-500",
  },
  {
    value: "REVIEW",
    label: "Review",
    badgeClass: "bg-violet-50 text-violet-700 ring-violet-200",
    dotClass: "bg-violet-500",
    columnBorderClass: "border-t-violet-500",
  },
  {
    value: "BLOCKED",
    label: "Blocked",
    badgeClass: "bg-rose-50 text-rose-700 ring-rose-200",
    dotClass: "bg-rose-500",
    columnBorderClass: "border-t-rose-500",
  },
  {
    value: "DONE",
    label: "Done",
    badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dotClass: "bg-emerald-500",
    columnBorderClass: "border-t-emerald-500",
  },
  {
    value: "ARCHIVED",
    label: "Archived",
    badgeClass: "bg-zinc-100 text-zinc-600 ring-zinc-200",
    dotClass: "bg-zinc-400",
    columnBorderClass: "border-t-zinc-400",
  },
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  BLOCKED: "Blocked",
  DONE: "Done",
  ARCHIVED: "Archived",
};

export const TASK_STATUS_BADGE_CLASSES: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700 ring-slate-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-200",
  REVIEW: "bg-violet-50 text-violet-700 ring-violet-200",
  BLOCKED: "bg-rose-50 text-rose-700 ring-rose-200",
  DONE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ARCHIVED: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export const TASK_PRIORITY_OPTIONS: Array<{
  value: TaskPriority;
  label: string;
  badgeClass: string;
}> = [
  {
    value: "URGENT",
    label: "Urgent",
    badgeClass: "bg-red-50 text-red-700 ring-red-200",
  },
  {
    value: "HIGH",
    label: "High",
    badgeClass: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    badgeClass: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  {
    value: "LOW",
    label: "Low",
    badgeClass: "bg-slate-100 text-slate-600 ring-slate-200",
  },
];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const TASK_PRIORITY_BADGE_CLASSES: Record<TaskPriority, string> = {
  URGENT: "bg-red-50 text-red-700 ring-red-200",
  HIGH: "bg-amber-50 text-amber-700 ring-amber-200",
  MEDIUM: "bg-sky-50 text-sky-700 ring-sky-200",
  LOW: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const TASK_SORT_OPTIONS: Array<{
  value: string;
  label: string;
  sortBy: TaskSortField;
  sortOrder: TaskSortOrder;
}> = [
  {
    value: "dueDate:asc",
    label: "Due date (soonest)",
    sortBy: "dueDate",
    sortOrder: "asc",
  },
  {
    value: "updatedAt:desc",
    label: "Recently updated",
    sortBy: "updatedAt",
    sortOrder: "desc",
  },
  {
    value: "createdAt:desc",
    label: "Newly created",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  {
    value: "priority:desc",
    label: "Priority (highest)",
    sortBy: "priority",
    sortOrder: "desc",
  },
];
