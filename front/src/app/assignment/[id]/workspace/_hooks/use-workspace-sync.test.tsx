import { act, renderHook } from "@testing-library/react";
import { createStorageWorkspaceSync } from "@/app/integration/file-storage-api/source-storage";
import { FileNode } from "@/types/shared";
import { useWorkspaceSync } from "./use-workspace-sync";
jest.mock("@/app/integration/file-storage-api/source-storage", () => ({
  createStorageWorkspaceSync: jest.fn(),
}));
const createSync = createStorageWorkspaceSync as jest.Mock;
const sync = jest.fn();
const tree = (content: string): FileNode => ({
  id: "root",
  path: "",
  isSelectable: false,
  children: [
    { id: "app.js", path: "app.js", isSelectable: true, isFile: true, content },
  ],
});
beforeEach(() => {
  jest.useFakeTimers();
  createSync.mockReset().mockReturnValue(sync);
  sync.mockReset().mockResolvedValue({ revision: 1 });
});
afterEach(() => {
  jest.useRealTimers();
});
async function debounce() {
  await act(async () => {
    jest.advanceTimersByTime(750);
  });
}
it("waits for reconciliation and debounces rapid edits to the latest bytes", async () => {
  const view = renderHook(
    ({ value, ready }) => useWorkspaceSync(1, 1, value, ready),
    { initialProps: { value: tree("old"), ready: false } },
  );
  await debounce();
  expect(sync).not.toHaveBeenCalled();
  view.rerender({ value: tree("first"), ready: true });
  view.rerender({ value: tree("latest"), ready: true });
  await debounce();
  expect(sync).toHaveBeenCalledTimes(1);
  expect(sync).toHaveBeenCalledWith({ "app.js": "latest" });
  expect(view.result.current.status).toBe("saved");
});
it("keeps local files on network failure and retries on reconnect", async () => {
  sync.mockRejectedValueOnce(Error("offline"));
  const value = tree("local");
  const view = renderHook(() => useWorkspaceSync(1, 1, value, true));
  await debounce();
  expect(view.result.current.status).toBe("error");
  expect(value.children?.[0].content).toBe("local");
  act(() => window.dispatchEvent(new Event("online")));
  await debounce();
  expect(sync).toHaveBeenCalledTimes(2);
  expect(view.result.current.status).toBe("saved");
});
it("ignores old completion while newer edits wait and aborts on account change", async () => {
  let finish!: () => void;
  sync.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const view = renderHook(
    ({ value, user }) => useWorkspaceSync(1, user, value, true),
    { initialProps: { value: tree("first"), user: 1 } },
  );
  await debounce();
  const signal = createSync.mock.calls[0][2] as AbortSignal;
  view.rerender({ value: tree("newer"), user: 1 });
  await act(async () => {
    finish();
  });
  expect(view.result.current.status).toBe("pending");
  expect(signal.aborted).toBe(false);
  expect(createSync).toHaveBeenCalledTimes(1);
  view.rerender({ value: tree("new user"), user: 2 });
  expect(signal.aborted).toBe(true);
  await debounce();
  expect(view.result.current.status).toBe("saved");
  expect(createSync).toHaveBeenLastCalledWith(1, 2, expect.any(AbortSignal), "workspace");
  const lastSignal = createSync.mock.calls[1][2] as AbortSignal;
  view.unmount();
  expect(lastSignal.aborted).toBe(true);
});
