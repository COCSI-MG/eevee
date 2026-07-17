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

  static async requestReset(email: string) {
    const response = await axiosClient.post('/auth/forgot-password', { email });

    return response.data as { message: string };
  }

  static async confirmReset(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    const response = await axiosClient.post('/auth/reset-password', {
      token,
      newPassword,
      confirmPassword,
    });

    return response.data as { message: string };
  }
}
