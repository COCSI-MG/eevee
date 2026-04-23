export abstract class AiReportService {
  abstract refineReport(rawReport: string, assignmentDescription: string, resolucao?: string): Promise<string>;
}
