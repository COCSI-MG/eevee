import { Module } from '@nestjs/common';
import { AiReportService } from './ai-report.abstract';
import { GroqReportService } from './groq-report.service';

@Module({
  providers: [{ provide: AiReportService, useClass: GroqReportService }],
  exports: [AiReportService],
})
export class AiReportModule {}
