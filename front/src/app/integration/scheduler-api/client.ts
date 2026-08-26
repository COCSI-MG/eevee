"use client";

import { AuthSession } from "@/app/interface/scheduler-api/auth";
import { Route } from "@/app/routes";
import axios, { AxiosError } from "axios";

export const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const axiosClientWithAuth = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let renewalInFlight: Promise<AuthSession | null> | null = null;

export function renewSession(): Promise<AuthSession | null> {
  if (!renewalInFlight) {
    renewalInFlight = requestRenewal().finally(() => {
      renewalInFlight = null;
    });
  }

  return renewalInFlight;
}

async function requestRenewal(): Promise<AuthSession | null> {
  try {
    const { data } = await axiosClient.post<AuthSession>("/auth/refresh");
    return data;
  } catch (error) {
    if ((error as AxiosError).response?.status !== 409) {
      return null;
    }

    // 409 significa que outra aba renovou primeiro. Os cookies novos já estão
    // no navegador, falta só descobrir o prazo do token que chegou.
    try {
      const { data } = await axiosClient.get<AuthSession>("/auth/me");
      return data;
    } catch {
      return null;
    }
  }
}

axiosClientWithAuth.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status ?? error.status;

    if (status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = `/${Route.Login}`;
      }
    }

    if (status === 500) {
      console.error("Server error:", error);
      return Promise.reject(
        new Error(
          "Ocorreu um erro no servidor. Por favor, tente novamente mais tarde.",
        ),
      );
    }

    if (!error.response) {
      console.error("Network or no-response error:", error);
      return Promise.reject(
        new Error(
          "Não foi possível conectar ao servidor. Por favor, verifique sua conexão e tente novamente.",
        ),
      );
    }

    console.error("Response error:", error);

    if (error.response.data) {
      const { message } = error.response.data as { message?: string };
      if (message) {
        return Promise.reject(new Error(message));
      }
    }

    return Promise.reject(error);
  },
);
