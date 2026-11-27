import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';

export type RecordActivityLogInput = {
  workspaceId: string;
  actorId?: string | null;
  entityType: 'WORKSPACE' | 'MEMBER' | 'INVITATION' | 'PROJECT' | 'TASK';
  entityId?: string | null;
  action: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async record(input: RecordActivityLogInput): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          workspaceId: input.workspaceId,
          actorId: input.actorId ?? null,
          entityType: input.entityType,
          entityId: input.entityId ?? null,
          action: input.action,
          summary: input.summary,
          ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to record activity log (${input.action}): ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  async findByWorkspace(
    workspaceId: string,
    currentUserId: string,
    query: QueryActivityLogsDto = {},
  ) {
    await this.workspaceAccessService.assertMember(workspaceId, currentUserId);

    const limit = query.limit ?? 40;
    const entityType = query.entityType?.trim();

    const logs = await this.prisma.activityLog.findMany({
      where: {
        workspaceId,
        ...(entityType && entityType !== 'ALL' ? { entityType } : {}),
      },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((log) => ({
      id: log.id,
      workspaceId: log.workspaceId,
      actorId: log.actorId,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      summary: log.summary,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
      actor: log.actor,
    }));
  }
}
