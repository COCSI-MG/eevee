"use client";

import { io, Socket } from "socket.io-client";

export type SchedulingRealtimeEventName = "preview:update" | "attempt:update";

export interface SchedulingRealtimePayload {
  id: number;
  status: string;
}

let socket: Socket | null = null;
let renewalChannel: BroadcastChannel | null = null;

function reconnectExistingSocket(): void {
  // Reuse the Socket so mounted subscribers keep their listeners. A new
  // transport handshake is required to send the refreshed HttpOnly cookie.
  socket?.disconnect().connect();
}

function getRenewalChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  if (!renewalChannel) {
    try {
      renewalChannel = new BroadcastChannel("eevee:session-renewed");
      renewalChannel.onmessage = (event) => {
        if (event.data === "renewed") reconnectExistingSocket();
      };
    } catch {
      // Each tab still reconnects on its own renewal if messaging is unavailable.
      return null;
    }
  }
  return renewalChannel;
}

export function refreshSchedulingSocketSession(): void {
  reconnectExistingSocket();
  // Cookies are shared across tabs; sockets and their expiry timers are not.
  getRenewalChannel()?.postMessage("renewed");
}

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
  getRenewalChannel();
  socket = io("/realtime", {
    withCredentials: true,
    forceNew: true,
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  let disconnectedAt: number | null = null;
  socket.on("disconnect", (reason) => {
    disconnectedAt = Date.now();
    console.debug("[realtime] disconnected", { reason });
  });
  socket.on("connect", () => {
    console.debug("[realtime] connected", {
      socketId: socket?.id,
      downtimeMs: disconnectedAt === null ? 0 : Date.now() - disconnectedAt,
    });
    disconnectedAt = null;
  });
  socket.io.on("reconnect", (attempt) => {
    console.debug("[realtime] transport reconnected", { attempt });
  });

  return socket;
}
