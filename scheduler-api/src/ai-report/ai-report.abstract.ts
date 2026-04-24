export abstract class AiReportService {
  abstract refineReport(rawReport: string, assignmentDescription: string, files?: Record<string, string>): Promise<string>;
}
