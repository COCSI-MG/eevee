'use client';

import { AuthContext } from '@/app/context/auth-context';
import { Route } from '@/app/routes';
// import { Route } from "@/app/routes";
import axios, { AxiosError } from 'axios';

export const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const axiosClientWithAuth = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClientWithAuth.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

axiosClientWithAuth.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status ?? error.status;

    if (status === 401) {
      AuthContext.clear();
      window.location.href = `/${Route.Login}`;
    }

    if (status === 500) {
      console.error('Server error:', error);
      return Promise.reject(new Error('Ocorreu um erro no servidor. Por favor, tente novamente mais tarde.'));
    }

    if (!error.response) {
      console.error('Network or no-response error:', error);
      return Promise.reject(
        new Error('Não foi possível conectar ao servidor. Por favor, verifique sua conexão e tente novamente.')
      );
    }

    console.error('Response error:', error);

    if (error.response.data) {
      const { message } = error.response.data as { message?: string };
      if (message) {
        return Promise.reject(new Error(message));
      }
    }

    return Promise.reject(error);
  }
);
