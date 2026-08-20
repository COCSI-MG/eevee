import { Injectable } from '@nestjs/common';
import { AttemptService } from 'src/attempt/attempt.service';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';

@Injectable()
export class SchedulingAttemptTransitionService {
  constructor(private readonly attemptService: AttemptService) {}

  async markRunning(attemptId: number) {
    await this.attemptService.update({
      id: attemptId,
      status: AttemptStatus.RUNNING,
    });
  }

  async markFailedNoTests(attemptId: number) {
    await this.attemptService.update({
      id: attemptId,
      isAcceptable: false,
      report: 'No test files available for execution.',
      status: AttemptStatus.FAILED,
    });
  }

  async markCompleted(params: {
    attemptId: number;
    isAcceptable: boolean;
    score: number;
    report: string;
    fails: number;
    passes: number;
    refinedReport?: string;
  }) {
    await this.attemptService.update({
      id: params.attemptId,
      isAcceptable: params.isAcceptable,
      score: params.score,
      report: params.report,
      fails: params.fails,
      passes: params.passes,
      refinedReport: params.refinedReport,
      status: AttemptStatus.COMPLETED,
    });
  }

  async markFailedWorkerError(attemptId: number, errorMessage: string) {
    await this.attemptService.update({
      id: attemptId,
      isAcceptable: false,
      score: 0,
      report: `Worker creation failed: ${errorMessage}`,
      fails: 0,
      passes: 0,
      status: AttemptStatus.FAILED,
    });
  }
}