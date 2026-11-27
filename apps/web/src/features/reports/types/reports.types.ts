export type ReportKpis = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  unassignedTasks: number;
  completionRate: number;
  overdueRate: number;
  memberCount: number;
};

export type ProjectProgressItem = {
  projectId: string;
  name: string;
  status: string;
  memberCount: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  progressPercent: number;
};

export type MemberWorkloadItem = {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionPercent: number;
};

export type WeeklyActivityItem = {
  date: string;
  tasksCreated: number;
  tasksCompleted: number;
};

export type WorkspaceReportOverview = {
  kpis: ReportKpis;
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  projectProgress: ProjectProgressItem[];
  memberWorkload: MemberWorkloadItem[];
  weeklyActivity: WeeklyActivityItem[];
};

export type ActivityLogItem = {
  id: string;
  workspaceId: string;
  actorId: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  summary: string;
  createdAt: string;
  actor: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
};
