import { Injectable } from '@nestjs/common';
import { PresenceStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service';

export type PresenceSnapshot = {
  userId: string;
  status: PresenceStatus;
  statusMessage: string | null;
  lastActiveAt: string;
};

@Injectable()
export class PresenceService {
  private readonly activeSockets = new Map<string, Set<string>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  isUserOnline(userId: string): boolean {
    const sockets = this.activeSockets.get(userId);
    return Boolean(sockets && sockets.size > 0);
  }

  async handleUserConnected(
    userId: string,
    socketId: string,
  ): Promise<PresenceSnapshot> {
    let sockets = this.activeSockets.get(userId);
    if (!sockets) {
      sockets = new Set<string>();
      this.activeSockets.set(userId, sockets);
    }
    sockets.add(socketId);

    const existing = await this.prisma.userPresence.findUnique({
      where: { userId },
      select: { preferredStatus: true, statusMessage: true },
    });

    const restoredStatus =
      existing?.preferredStatus &&
      existing.preferredStatus !== PresenceStatus.OFFLINE
        ? existing.preferredStatus
        : PresenceStatus.ONLINE;

    const now = new Date();
    const updated = await this.prisma.userPresence.upsert({
      where: { userId },
      create: {
        userId,
        status: restoredStatus,
        preferredStatus: restoredStatus,
        lastActiveAt: now,
      },
      update: {
        status: restoredStatus,
        lastActiveAt: now,
      },
    });

    return {
      userId: updated.userId,
      status: updated.status,
      statusMessage: updated.statusMessage,
      lastActiveAt: updated.lastActiveAt.toISOString(),
    };
  }

  async handleUserDisconnected(
    userId: string,
    socketId: string,
  ): Promise<PresenceSnapshot | null> {
    const sockets = this.activeSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size > 0) {
        return null;
      }
      this.activeSockets.delete(userId);
    }

    const now = new Date();
    const updated = await this.prisma.userPresence.upsert({
      where: { userId },
      create: {
        userId,
        status: PresenceStatus.OFFLINE,
        preferredStatus: PresenceStatus.ONLINE,
        lastActiveAt: now,
      },
      update: {
        status: PresenceStatus.OFFLINE,
        lastActiveAt: now,
      },
    });

    return {
      userId: updated.userId,
      status: PresenceStatus.OFFLINE,
      statusMessage: updated.statusMessage,
      lastActiveAt: updated.lastActiveAt.toISOString(),
    };
  }

  async setManualStatus(
    userId: string,
    status: PresenceStatus,
    statusMessage?: string | null,
  ): Promise<PresenceSnapshot> {
    const now = new Date();
    const existing = await this.prisma.userPresence.findUnique({
      where: { userId },
      select: { preferredStatus: true, statusMessage: true },
    });

    const nextPreferred =
      status !== PresenceStatus.OFFLINE
        ? status
        : (existing?.preferredStatus ?? PresenceStatus.ONLINE);

    const resolvedMessage =
      statusMessage !== undefined
        ? statusMessage?.trim() || null
        : (existing?.statusMessage ?? null);

    const updated = await this.prisma.userPresence.upsert({
      where: { userId },
      create: {
        userId,
        status,
        preferredStatus: nextPreferred,
        statusMessage: resolvedMessage,
        lastActiveAt: now,
      },
      update: {
        status,
        preferredStatus: nextPreferred,
        statusMessage: resolvedMessage,
        lastActiveAt: now,
      },
    });

    const effectiveStatus =
      status === PresenceStatus.OFFLINE || !this.isUserOnline(userId)
        ? status === PresenceStatus.OFFLINE
          ? PresenceStatus.OFFLINE
          : updated.status
        : updated.status;

    return {
      userId: updated.userId,
      status: effectiveStatus,
      statusMessage: updated.statusMessage,
      lastActiveAt: updated.lastActiveAt.toISOString(),
    };
  }

  async getUserPresence(userId: string): Promise<PresenceSnapshot> {
    const record = await this.prisma.userPresence.findUnique({
      where: { userId },
    });

    const online = this.isUserOnline(userId);
    const effectiveStatus = !online
      ? PresenceStatus.OFFLINE
      : record && record.status !== PresenceStatus.OFFLINE
        ? record.status
        : PresenceStatus.ONLINE;

    return {
      userId,
      status: effectiveStatus,
      statusMessage: record?.statusMessage ?? null,
      lastActiveAt: (record?.lastActiveAt ?? new Date()).toISOString(),
    };
  }

  async getWorkspacePresences(
    workspaceId: string,
    currentUserId: string,
  ): Promise<PresenceSnapshot[]> {
    await this.workspaceAccessService.assertMember(workspaceId, currentUserId);

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: {
        userId: true,
        user: {
          select: {
            presence: true,
          },
        },
      },
    });

    return members.map((member) => {
      const online = this.isUserOnline(member.userId);
      const record = member.user.presence;
      const effectiveStatus = !online
        ? PresenceStatus.OFFLINE
        : record && record.status !== PresenceStatus.OFFLINE
          ? record.status
          : PresenceStatus.ONLINE;

      return {
        userId: member.userId,
        status: effectiveStatus,
        statusMessage: record?.statusMessage ?? null,
        lastActiveAt: (record?.lastActiveAt ?? new Date()).toISOString(),
      };
    });
  }

  async getUserWorkspaceIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    });

    return memberships.map((item) => item.workspaceId);
  }
}
