export const EXECUTION_COMMAND_QUEUE = 'execution-commands';
export const EXECUTION_RESULTS_QUEUE = 'execution-results';

export type ExecutionLifecycleStatus = 'running' | 'completed' | 'failed';

export interface ExecutionWorkerPayload {
  applicationFileContent?: string;
  files?: Record<string, string>;
  testFilesContent?: string[];
  dependencies?: string[];
  initSqlScript?: string;
  templateVariablesModuleContent?: string;
}

export interface ExecutionCommand {
  attemptId: number;
  userId: number;
  workerType: string;
  workerData: ExecutionWorkerPayload;
}

export type ExecutionEventName =
  | 'execution.started.v1'
  | 'execution.completed.v1'
  | 'execution.failed.v1';

export interface ExecutionResult {
  isAcceptable: boolean;
  score: number;
  report: string;
  fails: number;
  passes: number;
}

export interface ExecutionEvent {
  eventId: string;
  name: ExecutionEventName;
  occurredAt: string;
  attemptId: number;
  userId: number;
  status: ExecutionLifecycleStatus;
  result?: ExecutionResult;
  errorMessage?: string;
}
