import { act, renderHook } from "@testing-library/react";
import { useSchedulingRealtimeEvent } from "./use-scheduling-realtime";
import { getSchedulingSocket } from "@/app/integration/scheduler-api/realtime";

jest.mock("@/app/integration/scheduler-api/realtime", () => ({
  getSchedulingSocket: jest.fn(),
}));

it("reconciles missed updates on reconnect and removes listeners on unmount", () => {
  const listeners = new Map<string, (...args: unknown[]) => void>();
  const socket = {
    on: jest.fn((name, listener) => listeners.set(name, listener)),
    off: jest.fn((name) => listeners.delete(name)),
  };
  jest.mocked(getSchedulingSocket).mockReturnValue(socket as never);
  const handler = jest.fn();
  const reconcile = jest.fn();
  const { rerender, unmount } = renderHook(
    ({ onConnect }) =>
      useSchedulingRealtimeEvent("attempt:update", handler, true, onConnect),
    { initialProps: { onConnect: reconcile } },
  );
  act(() => listeners.get("connect")?.());
  expect(reconcile).toHaveBeenCalledTimes(1);
  const latestReconcile = jest.fn();
  rerender({ onConnect: latestReconcile });
  act(() => listeners.get("connect")?.());
  expect(latestReconcile).toHaveBeenCalledTimes(1);
  const payload = { id: 1, status: "completed" };
  act(() => listeners.get("attempt:update")?.(payload));
  expect(handler).toHaveBeenCalledWith(payload);
  expect(socket.on).toHaveBeenCalledTimes(2);
  unmount();
  expect(listeners.size).toBe(0);
});
