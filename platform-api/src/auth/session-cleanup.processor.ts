import { Processor, WorkerHost } from '@nestjs/bullmq';
import { RefreshSessionService } from './refresh-session.service';

@Processor('session-cleanup-queue')
export class SessionCleanupConsumer extends WorkerHost {
  constructor(private readonly refreshSessionService: RefreshSessionService) {
    super();
  }

  async process(): Promise<void> {
    await this.refreshSessionService.cleanupExpiredSessions();
  }
}
