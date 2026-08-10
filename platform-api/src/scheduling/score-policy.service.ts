import { Injectable } from '@nestjs/common';
import { WorkerResponse } from 'src/worker/worker.interfaces';

@Injectable()
export class ScorePolicyService {
  calculateScore(result: WorkerResponse): number {
    return result.passes / (result.passes + result.failures || 1);
  }

  isAcceptable(score: number): boolean {
    return score >= 0.7;
  }
}
