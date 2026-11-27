import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PresenceStatus, UserStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AccessTokenPayload } from '../auth/types/jwt-payload.type';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service';
import { ChatService, type FormattedChatMessage } from './chat.service';
import { PresenceService, type PresenceSnapshot } from './presence.service';

interface SocketUser {
  id: string;
  email: string;
  fullName: string;
}

interface AuthenticatedSocket extends Socket {
  data: {
    user?: SocketUser;
  };
}

interface WorkspaceRoomPayload {
  workspaceId: string;
}

interface ConversationRoomPayload {
  conversationId: string;
}

interface TypingPayload {
  conversationId: string;
}

interface PresenceSetPayload {
  status: PresenceStatus;
  statusMessage?: string | null;
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: ['http://localhost:5173'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
    private readonly chatService: ChatService,
    private readonly presenceService: PresenceService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const secret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        { secret },
      );

      if (payload.tokenType !== 'access') {
        client.disconnect(true);
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          fullName: true,
          status: true,
        },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        client.disconnect(true);
        return;
      }

      client.data.user = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      };

      await client.join(`user:${user.id}`);

      const workspaceIds = await this.presenceService.getUserWorkspaceIds(
        user.id,
      );

      for (const workspaceId of workspaceIds) {
        await client.join(`workspace:${workspaceId}`);
      }

      const snapshot = await this.presenceService.handleUserConnected(
        user.id,
        client.id,
      );

      await this.emitPresenceUpdate(user.id, snapshot, workspaceIds);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const user = client.data.user;
    if (!user) {
      return;
    }

    try {
      const snapshot = await this.presenceService.handleUserDisconnected(
        user.id,
        client.id,
      );

      if (snapshot) {
        await this.emitPresenceUpdate(user.id, snapshot);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to process disconnect for user ${user.id}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  @SubscribeMessage('workspace:join')
  async handleJoinWorkspace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: WorkspaceRoomPayload,
  ) {
    const user = client.data.user;
    if (!user || typeof payload?.workspaceId !== 'string') {
      return { ok: false };
    }

    try {
      await this.workspaceAccessService.assertMember(
        payload.workspaceId,
        user.id,
      );
      await client.join(`workspace:${payload.workspaceId}`);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: ConversationRoomPayload,
  ) {
    const user = client.data.user;
    if (!user || typeof payload?.conversationId !== 'string') {
      return { ok: false };
    }

    try {
      await this.chatService.assertConversationAccess(
        payload.conversationId,
        user.id,
      );
      await client.join(`conversation:${payload.conversationId}`);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  @SubscribeMessage('conversation:leave')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: ConversationRoomPayload,
  ) {
    if (typeof payload?.conversationId !== 'string') {
      return { ok: false };
    }

    await client.leave(`conversation:${payload.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: TypingPayload,
  ) {
    const user = client.data.user;
    if (!user || typeof payload?.conversationId !== 'string') {
      return;
    }

    try {
      await this.chatService.assertConversationAccess(
        payload.conversationId,
        user.id,
      );
      client
        .to(`conversation:${payload.conversationId}`)
        .emit('typing:updated', {
          conversationId: payload.conversationId,
          userId: user.id,
          fullName: user.fullName,
          isTyping: true,
        });
    } catch {
      // Ignore unauthorized typing events
    }
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: TypingPayload,
  ) {
    const user = client.data.user;
    if (!user || typeof payload?.conversationId !== 'string') {
      return;
    }

    client.to(`conversation:${payload.conversationId}`).emit('typing:updated', {
      conversationId: payload.conversationId,
      userId: user.id,
      fullName: user.fullName,
      isTyping: false,
    });
  }

  @SubscribeMessage('presence:set')
  async handlePresenceSet(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: PresenceSetPayload,
  ) {
    const user = client.data.user;
    if (!user || !Object.values(PresenceStatus).includes(payload?.status)) {
      return { ok: false };
    }

    const snapshot = await this.presenceService.setManualStatus(
      user.id,
      payload.status,
      payload.statusMessage,
    );

    await this.emitPresenceUpdate(user.id, snapshot);
    return { ok: true, presence: snapshot };
  }

  @SubscribeMessage('conversation:read')
  async handleConversationRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: ConversationRoomPayload,
  ) {
    const user = client.data.user;
    if (!user || typeof payload?.conversationId !== 'string') {
      return { ok: false };
    }

    try {
      const result = await this.chatService.markAsRead(
        payload.conversationId,
        user.id,
      );
      this.emitConversationRead(
        result.conversationId,
        result.userId,
        result.lastReadAt,
      );
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  emitNewMessage(payload: {
    message: FormattedChatMessage;
    workspaceId: string;
    conversationId: string;
    recipientUserIds: string[];
  }): void {
    if (!this.server) {
      return;
    }

    this.server
      .to(`conversation:${payload.conversationId}`)
      .emit('message:new', payload.message);

    for (const userId of payload.recipientUserIds) {
      this.server.to(`user:${userId}`).emit('conversation:activity', {
        workspaceId: payload.workspaceId,
        conversationId: payload.conversationId,
        message: payload.message,
      });
    }
  }

  emitUpdatedMessage(
    conversationId: string,
    message: FormattedChatMessage,
  ): void {
    if (!this.server) {
      return;
    }

    this.server
      .to(`conversation:${conversationId}`)
      .emit('message:updated', message);
  }

  emitDeletedMessage(
    conversationId: string,
    message: FormattedChatMessage,
  ): void {
    if (!this.server) {
      return;
    }

    this.server
      .to(`conversation:${conversationId}`)
      .emit('message:deleted', message);
  }

  emitConversationRead(
    conversationId: string,
    userId: string,
    lastReadAt: string,
  ): void {
    if (!this.server) {
      return;
    }

    this.server.to(`conversation:${conversationId}`).emit('conversation:read', {
      conversationId,
      userId,
      lastReadAt,
    });
  }

  async emitPresenceUpdate(
    userId: string,
    snapshot: PresenceSnapshot,
    knownWorkspaceIds?: string[],
  ): Promise<void> {
    if (!this.server) {
      return;
    }

    const workspaceIds =
      knownWorkspaceIds ??
      (await this.presenceService.getUserWorkspaceIds(userId));

    this.server.to(`user:${userId}`).emit('presence:updated', snapshot);

    for (const workspaceId of workspaceIds) {
      this.server
        .to(`workspace:${workspaceId}`)
        .emit('presence:updated', snapshot);
    }
  }

  private extractToken(client: AuthenticatedSocket): string | null {
    const auth = client.handshake.auth as Record<string, unknown> | undefined;
    if (typeof auth?.token === 'string' && auth.token.trim().length > 0) {
      return auth.token.trim();
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7).trim();
    }

    return null;
  }
}
