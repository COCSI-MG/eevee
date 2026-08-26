import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { RefreshSession } from './entities/refresh-session.entity';
import { getRefreshTtlSeconds } from './auth-cookie.util';

const ROTATION_GRACE_MS = 15 * 1000;

class RotationRaceError extends Error {}

export type RotationResult =
  | { status: 'rotated'; token: string; session: RefreshSession }
  | { status: 'raced' }
  | { status: 'denied' };

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
      return { status: 'denied' };
    }

    if (current.revokedAt) {
      const rotatedAgo = Date.now() - current.revokedAt.getTime();

      if (current.replacedBy && rotatedAgo <= ROTATION_GRACE_MS) {
        this.logger.debug(
          `Rotação concorrente ignorada (userId=${current.userId}, familyId=${current.familyId})`,
        );

        return { status: 'raced' };
      }

      // Registrado antes de revogar: se a revogação falhar, a suspeita não se
      // perde. Nunca inclui o token nem o hash.
      this.logger.warn(
        `Reuso de refresh token detectado, família revogada (userId=${current.userId}, familyId=${current.familyId})`,
      );

      await this.revokeFamily(current.familyId);
      return { status: 'denied' };
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

      return { status: 'rotated', token, session };
    } catch (error) {
      if (error instanceof RotationRaceError) {
        return { status: 'raced' };
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

  private generateToken() {
    return randomBytes(32).toString('hex');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
