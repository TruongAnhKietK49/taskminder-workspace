import { Injectable } from '@nestjs/common';
import {
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async getWorkspaceOverview(workspaceId: string, currentUserId: string) {
    await this.workspaceAccessService.assertMember(workspaceId, currentUserId);

    const visibleProjectsWhere =
      await this.projectAccessService.getVisibleProjectsWhere(
        workspaceId,
        currentUserId,
      );

    const [projects, tasks, members] = await Promise.all([
      this.prisma.project.findMany({
        where: visibleProjectsWhere,
        select: {
          id: true,
          name: true,
          status: true,
          _count: {
            select: { members: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.task.findMany({
        where: {
          project: visibleProjectsWhere,
          status: { not: TaskStatus.ARCHIVED },
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          projectId: true,
          assigneeId: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.workspaceMember.findMany({
        where: { workspaceId },
        select: {
          role: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      }),
    ]);

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const statusDistribution: Record<
      Exclude<TaskStatus, typeof TaskStatus.ARCHIVED>,
      number
    > = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.REVIEW]: 0,
      [TaskStatus.DONE]: 0,
      [TaskStatus.BLOCKED]: 0,
    };

    const priorityDistribution: Record<TaskPriority, number> = {
      [TaskPriority.LOW]: 0,
      [TaskPriority.MEDIUM]: 0,
      [TaskPriority.HIGH]: 0,
      [TaskPriority.URGENT]: 0,
    };

    let completedTasks = 0;
    let inProgressTasks = 0;
    let overdueTasks = 0;
    let dueSoonTasks = 0;
    let unassignedTasks = 0;

    const projectStatsMap = new Map<
      string,
      {
        totalTasks: number;
        completedTasks: number;
        inProgressTasks: number;
        overdueTasks: number;
      }
    >();

    const memberStatsMap = new Map<
      string,
      {
        totalAssigned: number;
        completed: number;
        inProgress: number;
        overdue: number;
      }
    >();

    for (const task of tasks) {
      if (task.status !== TaskStatus.ARCHIVED) {
        statusDistribution[task.status] += 1;
      }
      priorityDistribution[task.priority] += 1;

      const isDone = task.status === TaskStatus.DONE;
      const isInProgress =
        task.status === TaskStatus.IN_PROGRESS ||
        task.status === TaskStatus.REVIEW;
      const isOverdue = !isDone && task.dueDate !== null && task.dueDate < now;
      const isDueSoon =
        !isDone &&
        task.dueDate !== null &&
        task.dueDate >= now &&
        task.dueDate <= sevenDaysLater;

      if (isDone) completedTasks += 1;
      if (isInProgress) inProgressTasks += 1;
      if (isOverdue) overdueTasks += 1;
      if (isDueSoon) dueSoonTasks += 1;
      if (!task.assigneeId) unassignedTasks += 1;

      const pStat = projectStatsMap.get(task.projectId) ?? {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
      };
      pStat.totalTasks += 1;
      if (isDone) pStat.completedTasks += 1;
      if (isInProgress) pStat.inProgressTasks += 1;
      if (isOverdue) pStat.overdueTasks += 1;
      projectStatsMap.set(task.projectId, pStat);

      if (task.assigneeId) {
        const mStat = memberStatsMap.get(task.assigneeId) ?? {
          totalAssigned: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0,
        };
        mStat.totalAssigned += 1;
        if (isDone) mStat.completed += 1;
        if (isInProgress) mStat.inProgress += 1;
        if (isOverdue) mStat.overdue += 1;
        memberStatsMap.set(task.assigneeId, mStat);
      }
    }

    const totalTasks = tasks.length;
    const activeNonDoneTasks = totalTasks - completedTasks;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const overdueRate =
      activeNonDoneTasks > 0
        ? Math.round((overdueTasks / activeNonDoneTasks) * 100)
        : 0;

    const projectProgress = projects.map((project) => {
      const stat = projectStatsMap.get(project.id) ?? {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
      };
      const progressPercent =
        stat.totalTasks > 0
          ? Math.round((stat.completedTasks / stat.totalTasks) * 100)
          : 0;

      return {
        projectId: project.id,
        name: project.name,
        status: project.status,
        memberCount: project._count.members,
        ...stat,
        progressPercent,
      };
    });

    const memberWorkload = members.map((member) => {
      const stat = memberStatsMap.get(member.user.id) ?? {
        totalAssigned: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0,
      };
      const completionPercent =
        stat.totalAssigned > 0
          ? Math.round((stat.completed / stat.totalAssigned) * 100)
          : 0;

      return {
        userId: member.user.id,
        fullName: member.user.fullName,
        email: member.user.email,
        avatarUrl: member.user.avatarUrl,
        role: member.role,
        ...stat,
        completionPercent,
      };
    });

    const weeklyActivity = this.buildWeeklyActivity(tasks, now);

    return {
      kpis: {
        totalProjects: projects.length,
        activeProjects: projects.filter(
          (p) => p.status === ProjectStatus.ACTIVE,
        ).length,
        completedProjects: projects.filter(
          (p) => p.status === ProjectStatus.COMPLETED,
        ).length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        dueSoonTasks,
        unassignedTasks,
        completionRate,
        overdueRate,
        memberCount: members.length,
      },
      statusDistribution,
      priorityDistribution,
      projectProgress,
      memberWorkload,
      weeklyActivity,
    };
  }

  async exportTasksCsv(workspaceId: string, currentUserId: string) {
    await this.workspaceAccessService.assertMember(workspaceId, currentUserId);

    const visibleProjectsWhere =
      await this.projectAccessService.getVisibleProjectsWhere(
        workspaceId,
        currentUserId,
      );

    const [workspace, tasks] = await Promise.all([
      this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true },
      }),
      this.prisma.task.findMany({
        where: {
          project: visibleProjectsWhere,
          status: { not: TaskStatus.ARCHIVED },
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
          project: {
            select: { name: true },
          },
          assignee: {
            select: { fullName: true, email: true },
          },
          createdBy: {
            select: { fullName: true },
          },
        },
        orderBy: [{ projectId: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    const headers = [
      'Task ID',
      'Project',
      'Title',
      'Status',
      'Priority',
      'Assignee',
      'Assignee Email',
      'Created By',
      'Due Date',
      'Created At',
      'Updated At',
    ];

    const rows = tasks.map((task) => [
      task.id,
      task.project.name,
      task.title,
      task.status,
      task.priority,
      task.assignee?.fullName ?? 'Unassigned',
      task.assignee?.email ?? '',
      task.createdBy.fullName,
      task.dueDate ? task.dueDate.toISOString() : '',
      task.createdAt.toISOString(),
      task.updatedAt.toISOString(),
    ]);

    const csvLines = [
      headers.map((h) => this.escapeCsvCell(h)).join(','),
      ...rows.map((row) =>
        row.map((cell) => this.escapeCsvCell(cell)).join(','),
      ),
    ];

    const safeWorkspaceSlug = (workspace?.name ?? 'workspace')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return {
      filename: `taskminder-report-${safeWorkspaceSlug || 'workspace'}.csv`,
      content: `\uFEFF${csvLines.join('\r\n')}`,
    };
  }

  private buildWeeklyActivity(
    tasks: Array<{ status: TaskStatus; createdAt: Date; updatedAt: Date }>,
    now: Date,
  ) {
    const days: Array<{
      date: string;
      tasksCreated: number;
      tasksCompleted: number;
    }> = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(now);
      day.setUTCHours(0, 0, 0, 0);
      day.setUTCDate(day.getUTCDate() - offset);
      const nextDay = new Date(day);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      const tasksCreated = tasks.filter(
        (t) => t.createdAt >= day && t.createdAt < nextDay,
      ).length;
      const tasksCompleted = tasks.filter(
        (t) =>
          t.status === TaskStatus.DONE &&
          t.updatedAt >= day &&
          t.updatedAt < nextDay,
      ).length;

      days.push({
        date: day.toISOString().slice(0, 10),
        tasksCreated,
        tasksCompleted,
      });
    }

    return days;
  }

  private escapeCsvCell(rawValue: string): string {
    const neutralized = /^[=+\-@]/.test(rawValue) ? `'${rawValue}` : rawValue;
    const escaped = neutralized.replace(/"/g, '""');
    return `"${escaped}"`;
  }
}
