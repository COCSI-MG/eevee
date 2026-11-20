import { act, renderHook, waitFor } from "@testing-library/react";
import {
  getFileTreeSnapshot,
  compareAndReplaceFileTree,
} from "@/app/integration/filestash";
import {
  downloadStorageWorkspace,
  rememberStorageWorkspace,
  type StorageWorkspace,
} from "@/app/integration/file-storage-api/source-storage";
import { useWorkspaceInitialization } from "./use-workspace-initialization";
import type { Assignment } from "@/app/interface/platform-api/assignment";
import type { FileNode } from "@/types/shared";
jest.mock("@/app/integration/filestash", () => ({
  getFileTreeSnapshot: jest.fn(),
  compareAndReplaceFileTree: jest.fn(),
}));
jest.mock("@/hooks/use-toast", () => ({ toast: jest.fn() }));
jest.mock("@/app/integration/file-storage-api/source-storage", () => ({
  downloadStorageWorkspace: jest.fn(),
  rememberStorageWorkspace: jest.fn(),
}));
jest.mock("../_utils/workspace.utils", () => ({
  ensureAssignmentReadme: (t: unknown) => t,
  createInitialWorkspaceTree: () => ({
    id: "root",
    path: "",
    isFile: false,
    isSelectable: false,
    children: [],
  }),
  findFirstFile: (t: FileNode) => t.children?.[0],
  getAssignmentBoilerplate: () => "",
}));
const tree = (content: string): FileNode => ({
  id: "root",
  path: "",
  isFile: false,
  isSelectable: false,
  children: [
    { id: "app.ts", path: "app.ts", isFile: true, isSelectable: true, content },
  ],
});
const remote: StorageWorkspace = {
  files: { "app.ts": "remote" },
  revision: 2,
  baselineKey: "synthetic",
};
const deferred = <T,>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const props = () => ({
  assignment: { id: 1, title: "Synthetic" } as Assignment,
  userId: 1,
  setActiveFileContent: jest.fn(),
  replaceFileTree: jest.fn(),
  selectItem: jest.fn(),
});
beforeEach(() => {
  jest.clearAllMocks();
  (getFileTreeSnapshot as jest.Mock).mockResolvedValue({
    fileTree: tree("unsent local"),
    revision: 1,
  });
  (downloadStorageWorkspace as jest.Mock).mockResolvedValue(remote);
  (compareAndReplaceFileTree as jest.Mock).mockImplementation(
    async (_a, _u, expected, replacement) => ({
      applied: true,
      snapshot: { fileTree: replacement, revision: expected.revision + 1 },
    }),
  );
});
afterEach(() => {
  jest.restoreAllMocks();
});
it("restores saved files automatically in a fresh browser", async () => {
  (getFileTreeSnapshot as jest.Mock).mockResolvedValue({
    fileTree: null,
    revision: 0,
    generation: null,
  });
  const input = props();
  const { result } = renderHook(() => useWorkspaceInitialization(input));
  await waitFor(() => expect(result.current.isInitialized).toBe(true));

  expect(downloadStorageWorkspace).toHaveBeenCalledWith(1, { userId: 1 });
  expect(result.current.conflict).toBeNull();
  expect(compareAndReplaceFileTree).toHaveBeenCalledWith(
    1,
    1,
    expect.objectContaining({ fileTree: null, revision: 0 }),
    tree("remote"),
    expect.any(Function),
  );
  expect(input.replaceFileTree).toHaveBeenCalledWith(tree("remote"));
  expect(rememberStorageWorkspace).toHaveBeenCalledWith(remote);
});
it("dismissing the conflict preserves unsent files without accepting a baseline", async () => {
  const browserTree = tree("unsent local");
  browserTree.children?.push({
    id: "notes.txt",
    path: "notes.txt",
    isFile: true,
    isSelectable: true,
    content: "",
  });
  (getFileTreeSnapshot as jest.Mock).mockResolvedValue({
    fileTree: browserTree,
    revision: 1,
  });
  (downloadStorageWorkspace as jest.Mock).mockResolvedValue({
    ...remote,
    files: { ...remote.files, "server.txt": "" },
  });
  const input = props();
  const { result } = renderHook(() => useWorkspaceInitialization(input));
  await waitFor(() =>
    expect(result.current.conflict?.files).toEqual([
      { path: "app.ts", browserContent: "unsent local", serverContent: "remote" },
      { path: "notes.txt", browserContent: "", serverContent: undefined },
      { path: "server.txt", browserContent: undefined, serverContent: "" },
    ]),
  );
  expect(result.current.isInitialized).toBe(false);
  expect(compareAndReplaceFileTree).not.toHaveBeenCalled();
  act(() => result.current.conflict?.choose("cancel"));
  await waitFor(() => expect(result.current.isInitialized).toBe(true));
  expect(input.replaceFileTree).toHaveBeenCalledWith(browserTree);
  expect(compareAndReplaceFileTree).toHaveBeenCalledWith(
    1,
    1,
    expect.any(Object),
    browserTree,
    expect.any(Function),
  );
  expect(rememberStorageWorkspace).not.toHaveBeenCalled();
});
it("choosing the browser accepts only the reviewed server revision for upload", async () => {
  const input = props();
  const { result } = renderHook(() => useWorkspaceInitialization(input));
  await waitFor(() => expect(result.current.conflict).not.toBeNull());
  act(() => result.current.conflict?.choose("browser"));
  await waitFor(() => expect(result.current.isInitialized).toBe(true));
  expect(input.replaceFileTree).toHaveBeenCalledWith(tree("unsent local"));
  expect(rememberStorageWorkspace).toHaveBeenCalledWith(remote);
});
it("accepting commits the verified remote tree before remembering its baseline", async () => {
  const input = props();
  const { result } = renderHook(() => useWorkspaceInitialization(input));
  await waitFor(() => expect(result.current.conflict).not.toBeNull());
  act(() => result.current.conflict?.choose("server"));
  await waitFor(() => expect(result.current.isInitialized).toBe(true));
  expect(compareAndReplaceFileTree).toHaveBeenCalledWith(
    1,
    1,
    expect.objectContaining({ revision: 1 }),
    expect.objectContaining({
      children: [expect.objectContaining({ content: "remote" })],
    }),
    expect.any(Function),
  );
  expect(rememberStorageWorkspace).toHaveBeenCalledWith(remote);
});
it("preserves a newer local save made while downloading", async () => {
  const pending = deferred<StorageWorkspace>();
  (downloadStorageWorkspace as jest.Mock).mockReturnValue(pending.promise);
  const input = props();
  const { result } = renderHook(() => useWorkspaceInitialization(input));
  await waitFor(() => expect(downloadStorageWorkspace).toHaveBeenCalled());
  (getFileTreeSnapshot as jest.Mock).mockResolvedValue({
    fileTree: tree("newer unsent"),
    revision: 2,
  });
  await act(async () => pending.resolve(remote));
  await waitFor(() => expect(result.current.conflict).not.toBeNull());
  expect(result.current.conflict?.files[0].browserContent).toBe("newer unsent");
  act(() => result.current.conflict?.choose("browser"));
  await waitFor(() => expect(result.current.isInitialized).toBe(true));
  expect(input.replaceFileTree).toHaveBeenCalledWith(tree("newer unsent"));
  expect(compareAndReplaceFileTree).toHaveBeenCalledWith(
    1,
    1,
    expect.objectContaining({ revision: 2 }),
    tree("newer unsent"),
    expect.any(Function),
  );
});
it("ignores a stale response after unmount", async () => {
  const pending = deferred<StorageWorkspace>();
  (downloadStorageWorkspace as jest.Mock).mockReturnValue(pending.promise);
  const input = props();
  const { unmount } = renderHook(() => useWorkspaceInitialization(input));
  await waitFor(() => expect(downloadStorageWorkspace).toHaveBeenCalled());
  unmount();
  await act(async () => pending.resolve(remote));
  expect(input.replaceFileTree).not.toHaveBeenCalled();
  expect(compareAndReplaceFileTree).not.toHaveBeenCalled();
});
it("ignores the previous account response after switching accounts", async () => {
  const pending = deferred<StorageWorkspace>();
  (downloadStorageWorkspace as jest.Mock)
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValueOnce({ ...remote, files: { "app.ts": "unsent local" } });
  const input = props();
  const { result, rerender } = renderHook(
    ({ userId }) => useWorkspaceInitialization({ ...input, userId }),
    { initialProps: { userId: 1 } },
  );
  await waitFor(() =>
    expect(downloadStorageWorkspace).toHaveBeenCalledTimes(1),
  );
  rerender({ userId: 2 });
  await waitFor(() => expect(result.current.isInitialized).toBe(true));
  const count = input.replaceFileTree.mock.calls.length;
  await act(async () => pending.resolve(remote));
  expect(input.replaceFileTree).toHaveBeenCalledTimes(count);
  expect(result.current.conflict).toBeNull();
});

it("invalidates an open conflict after switching accounts", async () => {
  (downloadStorageWorkspace as jest.Mock)
    .mockResolvedValueOnce(remote)
    .mockResolvedValueOnce({ ...remote, files: { "app.ts": "unsent local" } });
  const input = props();
  const { result, rerender } = renderHook(
    ({ userId }) => useWorkspaceInitialization({ ...input, userId }),
    { initialProps: { userId: 1 } },
  );
  await waitFor(() => expect(result.current.conflict).not.toBeNull());
  const previousConflict = result.current.conflict;

  rerender({ userId: 2 });
  await waitFor(() => expect(result.current.isInitialized).toBe(true));
  act(() => previousConflict?.choose("server"));

  expect(result.current.conflict).toBeNull();
  expect(compareAndReplaceFileTree).toHaveBeenCalledTimes(1);
  expect(compareAndReplaceFileTree).toHaveBeenCalledWith(
    1,
    2,
    expect.any(Object),
    tree("unsent local"),
    expect.any(Function),
  );
});

it("retains newer saved work if remote validation fails", async () => {
  jest.spyOn(console, "warn").mockImplementation(() => undefined);
  (downloadStorageWorkspace as jest.Mock).mockRejectedValue(
    new Error("synthetic corrupt remote"),
  );
  (getFileTreeSnapshot as jest.Mock).mockResolvedValue({
    fileTree: tree("newer saved"),
    revision: 2,
  });
  const input = props();
  const { result } = renderHook(() => useWorkspaceInitialization(input));
  await waitFor(() => expect(result.current.isInitialized).toBe(true));
  expect(input.replaceFileTree).toHaveBeenCalledWith(tree("newer saved"));
  expect(compareAndReplaceFileTree).toHaveBeenCalledWith(
    1,
    1,
    expect.objectContaining({ revision: 2 }),
    tree("newer saved"),
    expect.any(Function),
  );
  expect(rememberStorageWorkspace).not.toHaveBeenCalled();
});

it("preserves a newer save from another tab while the conflict is open", async () => {
  (compareAndReplaceFileTree as jest.Mock).mockResolvedValue({
    applied: false,
    snapshot: { fileTree: tree("saved after consent"), revision: 2 },
  });
  const input = props();
  const { result } = renderHook(() => useWorkspaceInitialization(input));
  await waitFor(() => expect(result.current.conflict).not.toBeNull());
  act(() => result.current.conflict?.choose("server"));
  await waitFor(() => expect(result.current.isInitialized).toBe(true));
  expect(input.replaceFileTree).toHaveBeenCalledWith(
    tree("saved after consent"),
  );
  expect(rememberStorageWorkspace).not.toHaveBeenCalled();
});
it("does not display or accept downloaded files until the IndexedDB transaction commits", async () => {
  const commit = deferred<{
    applied: boolean;
    snapshot: { fileTree: FileNode; revision: number };
  }>();
  (compareAndReplaceFileTree as jest.Mock).mockReturnValue(commit.promise);
  const input = props();
  const { result } = renderHook(() => useWorkspaceInitialization(input));
  await waitFor(() => expect(result.current.conflict).not.toBeNull());
  act(() => result.current.conflict?.choose("server"));
  await waitFor(() => expect(compareAndReplaceFileTree).toHaveBeenCalled());
  expect(input.replaceFileTree).not.toHaveBeenCalled();
  expect(rememberStorageWorkspace).not.toHaveBeenCalled();
  await act(async () =>
    commit.resolve({
      applied: true,
      snapshot: { fileTree: tree("remote"), revision: 2 },
    }),
  );
  await waitFor(() => expect(result.current.isInitialized).toBe(true));
  expect(rememberStorageWorkspace).toHaveBeenCalledWith(remote);
});
it("a transaction failure does not display remote files or advance baseline", async () => {
  jest.spyOn(console, "error").mockImplementation(() => undefined);
  (compareAndReplaceFileTree as jest.Mock).mockRejectedValue(
    new Error("synthetic abort"),
  );
  const input = props();
  const { result } = renderHook(() => useWorkspaceInitialization(input));
  await waitFor(() => expect(result.current.conflict).not.toBeNull());
  act(() => result.current.conflict?.choose("server"));
  await waitFor(() => expect(console.error).toHaveBeenCalled());
  expect(input.replaceFileTree).not.toHaveBeenCalled();
  expect(rememberStorageWorkspace).not.toHaveBeenCalled();
});
