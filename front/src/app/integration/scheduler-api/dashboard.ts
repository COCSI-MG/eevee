import { DashboardMetrics } from '@/app/interface/scheduler-api/dashboard';
import { axiosClientWithAuth } from './client';

export class DashboardService {
  static async getMetrics(): Promise<DashboardMetrics> {
    const response = await axiosClientWithAuth.get<DashboardMetrics>('/dashboard/metrics');
    return response.data;
  }
}
