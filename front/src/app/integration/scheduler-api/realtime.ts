"use client";

import { io, Socket } from "socket.io-client";

export type SchedulingRealtimeEventName = "preview:update" | "attempt:update";

export interface SchedulingRealtimePayload {
  id: number;
  status: string;
}

let socket: Socket | null = null;

export function getSchedulingSocket(): Socket | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (socket) {
    return socket;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    return null;
  }

  socket = io(`${baseUrl.replace(/\/$/, "")}/realtime`, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  return socket;
}
