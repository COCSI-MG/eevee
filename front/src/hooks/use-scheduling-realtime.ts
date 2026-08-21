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
): void {
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

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

    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [event, enabled]);
}
