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

  // Connect same-origin: the /socket.io/ handshake path is fixed by the
  // client library regardless of namespace, so it must not be prefixed with
  // the REST API base path (NEXT_PUBLIC_API_URL) — only the gateway's
  // /socket.io/ route (proxied straight to platform-api) can serve it.
  socket = io("/realtime", {
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  return socket;
}
