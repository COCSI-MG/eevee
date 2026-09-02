import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, LessThan, Repository } from 'typeorm';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { RefreshSession } from './entities/refresh-session.entity';
import { getRefreshTtlSeconds } from './auth-cookie.util';
import { SessionStatus } from './enums/session-status.enum';

const ROTATION_GRACE_MS = 15 * 1000;
const SESSION_HISTORY_RETENTION_DAYS = 7;

class RotationRaceError extends Error {}

export type RotationResult =
  | { status: SessionStatus.ROTATED; token: string; session: RefreshSession }
  | { status: SessionStatus.RACED }
  | { status: SessionStatus.DENIED };

@Injectable()
export class RefreshSessionService {
  private readonly logger = new Logger(RefreshSessionService.name);

  constructor(
    @InjectRepository(RefreshSession)
    private readonly refreshSessionRepository: Repository<RefreshSession>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async create(userId: number) {
    const token = this.generateToken();
    const ttlSeconds = getRefreshTtlSeconds(this.configService);

    const session = await this.refreshSessionRepository.save({
      userId,
      familyId: randomUUID(),
      tokenHash: this.hashToken(token),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      revokedAt: null,
      replacedBy: null,
    });

    return { token, session };
  }

  async rotate(rawToken: string): Promise<RotationResult> {
    const current = await this.refreshSessionRepository.findOne({
      where: { tokenHash: this.hashToken(rawToken) },
    });

    if (!current || current.expiresAt <= new Date()) {
      return { status: SessionStatus.DENIED };
    }

    if (current.revokedAt) {
      const rotatedAgo = Date.now() - current.revokedAt.getTime();

      if (current.replacedBy && rotatedAgo <= ROTATION_GRACE_MS) {
        this.logger.debug(
          `Rotação concorrente ignorada (userId=${current.userId}, familyId=${current.familyId})`,
        );

        return { status: SessionStatus.RACED };
      }

      // Registrado antes de revogar: se a revogação falhar, a suspeita não se
      // perde. Nunca inclui o token nem o hash.
      this.logger.warn(
        `Reuso de refresh token detectado, família revogada (userId=${current.userId}, familyId=${current.familyId})`,
      );

      await this.revokeFamily(current.familyId);
      return { status: SessionStatus.DENIED };
    }

    const token = this.generateToken();

    try {
      const session = await this.dataSource.transaction(async (manager) => {
        const created = await manager.save(RefreshSession, {
          userId: current.userId,
          familyId: current.familyId,
          tokenHash: this.hashToken(token),
          expiresAt: current.expiresAt,
          revokedAt: null,
          replacedBy: null,
        });

        const claimed = await manager.update(
          RefreshSession,
          { id: current.id, revokedAt: IsNull() },
          { revokedAt: new Date(), replacedBy: created.id },
        );

        if (claimed.affected === 0) {
          throw new RotationRaceError();
        }

        return created;
      });

      return { status: SessionStatus.ROTATED, token, session };
    } catch (error) {
      if (error instanceof RotationRaceError) {
        return { status: SessionStatus.RACED };
      }

      throw error;
    }
  }

  revokeFamily(familyId: string) {
    return this.refreshSessionRepository.update(
      { familyId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  revokeAllForUser(userId: number) {
    return this.refreshSessionRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  @Cron('0 3 * * *') // Todo dia às 03:00
  async cleanupExpiredSessions() {
    const cutoff = new Date(
      Date.now() - SESSION_HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );
    const startedAt = Date.now();

    try {
      const { affected } = await this.refreshSessionRepository.delete({
        expiresAt: LessThan(cutoff),
      });

      const remaining = await this.refreshSessionRepository.count();

      this.logger.log(
        `Limpeza de sessões concluída: ${affected ?? 0} linha(s) removida(s) ` +
          `com vencimento anterior a ${cutoff.toISOString()}, ` +
          `${remaining} linha(s) restante(s), em ${Date.now() - startedAt}ms`,
      );
    } catch (error) {
      this.logger.error(
        `Falha na limpeza de sessões com vencimento anterior a ${cutoff.toISOString()}`,
        error,
      );
    }
  }

  private generateToken() {
    return randomBytes(32).toString('hex');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
