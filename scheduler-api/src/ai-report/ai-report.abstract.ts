import { WorkerType } from 'src/worker/enum/worker-type.enum';

export abstract class AiReportService {
  abstract refineReport(
    rawReport: string,
    assignmentDescription: string,
    files?: Record<string, string>,
    workerType?: WorkerType,
  ): Promise<string>;
}
