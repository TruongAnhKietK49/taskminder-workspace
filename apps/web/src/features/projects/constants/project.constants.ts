import type { ProjectStatus } from "@/features/projects/types/project.types";

export const PROJECT_NAME_MAX_LENGTH = 120;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 1000;

export const PROJECT_STATUS_OPTIONS: Array<{
  value: ProjectStatus;
  label: string;
  description: string;
}> = [
  {
    value: "PLANNING",
    label: "Planning",
    description: "Dự án đang lên kế hoạch.",
  },
  {
    value: "ACTIVE",
    label: "Active",
    description: "Dự án đang triển khai.",
  },
  {
    value: "ON_HOLD",
    label: "On hold",
    description: "Dự án đang tạm dừng.",
  },
  {
    value: "COMPLETED",
    label: "Completed",
    description: "Dự án đã hoàn thành.",
  },
  {
    value: "ARCHIVED",
    label: "Archived",
    description: "Dự án đã được lưu trữ.",
  },
];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const PROJECT_STATUS_BADGE_CLASSES: Record<ProjectStatus, string> = {
  PLANNING: "bg-slate-100 text-slate-700 ring-slate-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ON_HOLD: "bg-amber-50 text-amber-700 ring-amber-200",
  COMPLETED: "bg-sky-50 text-sky-700 ring-sky-200",
  ARCHIVED: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};
