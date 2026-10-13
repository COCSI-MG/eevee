import type { ClassStudentPerformanceDto } from './dto/response/class-student-performance.dto';

export interface ClassPerformanceAggregationRow {
  total: string
  data: ClassStudentPerformanceDto[]
}
