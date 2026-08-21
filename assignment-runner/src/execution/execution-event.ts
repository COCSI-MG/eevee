import {
  ExecutionEvent as SharedExecutionEvent,
  ExecutionEventName,
} from '@eevee/execution-contracts';

export const EXECUTION_EVENT_NAMES = [
  'execution.started.v1',
  'execution.completed.v1',
  'execution.failed.v1',
] as const;

export type ExecutionEvent = SharedExecutionEvent;
export type { ExecutionEventName };