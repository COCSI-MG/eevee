"use client";

import React from "react";
import {
  getSchedulingSocket,
  SchedulingRealtimeEventName,
  SchedulingRealtimePayload,
} from "@/app/integration/scheduler-api/realtime";

export function useSchedulingRealtimeEvent(
  event: SchedulingRealtimeEventName,
  handler: (payload: SchedulingRealtimePayload) => void,
  enabled = true,
  onConnect?: () => void,
): void {
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;
  const onConnectRef = React.useRef(onConnect);
  onConnectRef.current = onConnect;

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = getSchedulingSocket();
    if (!socket) {
      return;
    }

    const listener = (payload: SchedulingRealtimePayload) => {
      handlerRef.current(payload);
    };

    // Room broadcasts missed while offline are not replayed. Reconcile REST
    // state on every connection, including a renewal-driven reconnect.
    const connected = () => onConnectRef.current?.();
    socket.on(event, listener);
    socket.on("connect", connected);

    return () => {
      socket.off(event, listener);
      socket.off("connect", connected);
    };
  }, [event, enabled]);
}
