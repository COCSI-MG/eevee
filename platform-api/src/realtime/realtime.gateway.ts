import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/jwt.interface';
import { getTokenFromCookieHeader } from '../auth/auth-cookie.util';

export const SCHEDULING_REALTIME_KINDS = ['preview', 'attempt'] as const;

export type SchedulingRealtimeKind = (typeof SCHEDULING_REALTIME_KINDS)[number];

export interface SchedulingRealtimeEvent {
  kind: SchedulingRealtimeKind;
  id: number;
  userId: number;
  status: string;
}

export function isSchedulingRealtimeEvent(
  data: unknown,
): data is SchedulingRealtimeEvent {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const { kind, id, userId, status } = data as Record<string, unknown>;

  return (
    typeof kind === 'string' &&
    (SCHEDULING_REALTIME_KINDS as readonly string[]).includes(kind) &&
    typeof id === 'number' &&
    typeof userId === 'number' &&
    typeof status === 'string'
  );
}

function userRoom(userId: number): string {
  return `user:${userId}`;
}

/**
 * Pushes async scheduling status transitions (preview runs and correction
 * attempts) to the authenticated user that owns them. Clients authenticate
 * with the same `eevee_auth` cookie used for HTTP requests.
 */
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private readonly server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token = getTokenFromCookieHeader(client.handshake.headers.cookie);

    if (!token) {
      this.logger.debug('Rejecting realtime connection without auth cookie');
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      void client.join(userRoom(payload.userId));
      this.logger.debug(
        `Realtime client ${client.id} joined room for user ${payload.userId}`,
      );
    } catch {
      this.logger.debug('Rejecting realtime connection with invalid token');
      client.disconnect(true);
    }
  }

  emitSchedulingEvent(event: SchedulingRealtimeEvent) {
    if (!this.server) {
      return;
    }

    this.server
      .to(userRoom(event.userId))
      .emit(`${event.kind}:update`, { id: event.id, status: event.status });
  }
}
