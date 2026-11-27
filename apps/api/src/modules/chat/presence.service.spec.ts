import { PresenceStatus } from '../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { WorkspaceAccessService } from '../workspaces/workspace-access.service';
import { PresenceService } from './presence.service';

describe('PresenceService', () => {
  const mockFindUnique = jest.fn();
  const mockUpsert = jest.fn();
  const mockFindManyWorkspaceMembers = jest.fn();
  const mockAssertMember = jest.fn();

  const mockPrisma = {
    userPresence: {
      findUnique: mockFindUnique,
      upsert: mockUpsert,
    },
    workspaceMember: {
      findMany: mockFindManyWorkspaceMembers,
    },
  };

  const mockWorkspaceAccessService = {
    assertMember: mockAssertMember,
  };

  let service: PresenceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PresenceService(
      mockPrisma as unknown as PrismaService,
      mockWorkspaceAccessService as unknown as WorkspaceAccessService,
    );
  });

  it('tracks multi-tab connections and only sets OFFLINE when the last socket disconnects', async () => {
    const now = new Date('2026-11-27T06:00:00.000Z');
    mockFindUnique.mockResolvedValue({
      preferredStatus: PresenceStatus.BUSY,
      statusMessage: 'In a meeting',
    });
    mockUpsert.mockResolvedValue({
      userId: 'user-1',
      status: PresenceStatus.BUSY,
      statusMessage: 'In a meeting',
      lastActiveAt: now,
    });

    const connected = await service.handleUserConnected('user-1', 'sock-1');
    expect(connected.status).toBe(PresenceStatus.BUSY);
    expect(service.isUserOnline('user-1')).toBe(true);

    await service.handleUserConnected('user-1', 'sock-2');
    const firstDisconnect = await service.handleUserDisconnected(
      'user-1',
      'sock-1',
    );
    expect(firstDisconnect).toBeNull();
    expect(service.isUserOnline('user-1')).toBe(true);

    mockUpsert.mockResolvedValue({
      userId: 'user-1',
      status: PresenceStatus.OFFLINE,
      statusMessage: 'In a meeting',
      lastActiveAt: now,
    });

    const finalDisconnect = await service.handleUserDisconnected(
      'user-1',
      'sock-2',
    );
    expect(finalDisconnect?.status).toBe(PresenceStatus.OFFLINE);
    expect(service.isUserOnline('user-1')).toBe(false);
  });

  it('updates manual status and resolves workspace presences accurately', async () => {
    const now = new Date('2026-11-27T06:00:00.000Z');
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({
      userId: 'user-1',
      status: PresenceStatus.ONLINE,
      statusMessage: null,
      lastActiveAt: now,
    });
    await service.handleUserConnected('user-1', 'sock-1');

    mockUpsert.mockResolvedValue({
      userId: 'user-1',
      status: PresenceStatus.AWAY,
      statusMessage: 'Lunch',
      lastActiveAt: now,
    });

    const manual = await service.setManualStatus(
      'user-1',
      PresenceStatus.AWAY,
      'Lunch',
    );
    expect(manual.status).toBe(PresenceStatus.AWAY);
    expect(manual.statusMessage).toBe('Lunch');

    mockAssertMember.mockResolvedValue({ id: 'wm-1' });
    mockFindManyWorkspaceMembers.mockResolvedValue([
      {
        userId: 'user-1',
        user: {
          presence: {
            status: PresenceStatus.AWAY,
            statusMessage: 'Lunch',
            lastActiveAt: now,
          },
        },
      },
      {
        userId: 'user-2',
        user: {
          // Even if DB still had ONLINE from an old session, no active socket => OFFLINE
          presence: {
            status: PresenceStatus.ONLINE,
            statusMessage: null,
            lastActiveAt: now,
          },
        },
      },
    ]);

    const presences = await service.getWorkspacePresences('ws-1', 'user-1');
    expect(presences).toEqual([
      {
        userId: 'user-1',
        status: PresenceStatus.AWAY,
        statusMessage: 'Lunch',
        lastActiveAt: now.toISOString(),
      },
      {
        userId: 'user-2',
        status: PresenceStatus.OFFLINE,
        statusMessage: null,
        lastActiveAt: now.toISOString(),
      },
    ]);
  });
});
