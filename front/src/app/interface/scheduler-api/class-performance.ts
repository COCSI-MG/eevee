import { PaginatedResponse } from "./pagination";

export interface ClassActivityOption {
  id: number;
  title: string;
}

export interface ClassInfos {
  id: number;
  name: string;
  description: string | null;
  deletedAt: string | null;
  activities: ClassActivityOption[];
}

export interface ClassPerformanceParams {
  page: number;
  pageSize: number;
  activityIds?: number[]
}


export interface ClassStudentPerformance {
  userId: number;
  name: string;
  grades: { activityId: number; grade: number | null }[];
  average: number | null;
}

export interface ClassPerformance extends PaginatedResponse<ClassStudentPerformance> {
  activities: ClassActivityOption[];
}
