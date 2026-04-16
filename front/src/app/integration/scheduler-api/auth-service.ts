'use client';

import { AuthSession } from '@/app/interface/scheduler-api/auth';
import { axiosClient } from './client';

export class AuthService {
  static async me() {
    const response = await axiosClient.get<AuthSession>('/auth/me');

    return response.data;
  }

  static async logout() {
    await axiosClient.post('/auth/logout');
  }
}
