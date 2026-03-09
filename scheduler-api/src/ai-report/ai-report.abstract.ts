export abstract class AiReportService {
  abstract refineReport(rawReport: string, assignmentDescription?: string): Promise<string>;
}
