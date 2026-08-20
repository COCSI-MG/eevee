import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';

export const EXECUTION_EVENT_NAMES = [
  'execution.started.v1',
  'execution.completed.v1',
  'execution.failed.v1',
] as const;

export type ExecutionEventName = (typeof EXECUTION_EVENT_NAMES)[number];

export interface ExecutionEvent {
  eventId: string;
  name: ExecutionEventName;
  occurredAt: string;
  attemptId: number;
  userId: number;
  status: AttemptStatus;
  result?: {
    isAcceptable: boolean;
    score: number;
    report: string;
    fails: number;
    passes: number;
  };
  errorMessage?: string;
}