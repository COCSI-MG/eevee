"use client";

import axios from "axios";

// As instâncias moram fora do client.ts para que quem só precisa delas não
// tenha que importar o módulo que registra o interceptor de renovação. É o que
// mantém o auth-service.ts e o client.ts livres de dependência circular. O
// client.ts reexporta as duas, então os importadores seguem usando "./client".
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
