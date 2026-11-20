/** @jest-environment node */
import { mkdtempSync, rmSync } from "node:fs";
import type { Server, IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { axiosClientWithAuth } from "../platform-api/client";
import { unzipSync } from "fflate";
import { createZip } from "@/utils/create-zip";
import {
  createStorageWorkspaceSync,
  downloadStorageWorkspace,
  prepareAnswerKeyRun,
  prepareStorageSubmission,
  rememberStorageWorkspace,
  saveAnswerKeyDraft,
} from "./source-storage";
jest.mock("../platform-api/client", () => ({ axiosClientWithAuth: { get: jest.fn() } }));
// The service fixture is compiled by make setup and CI before the frontend tests.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createServer } = require(
  resolve(process.cwd(), "../file-storage-api/dist/server.js"),
);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { hash } = require(
  resolve(process.cwd(), "../file-storage-api/dist/store.js"),
);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { issueGrant } = require(
  resolve(process.cwd(), "../file-storage-api/dist/grants.js"),
);

describe("direct source upload transport", () => {
  const secret = "local-synthetic-storage-secret-do-not-use-in-production";
  const scope = "eevee-u1-a1";
  type Workspace = {
    revision: number;
    files: Record<string, { digest: string; size: number }>;
  };
  type LocalStore = {
    putBlob(scope: string, digest: string, bytes: Buffer): unknown;
    getSnapshot(
      scope: string,
      id: string,
    ): { kind: string; files: Workspace["files"] };
    workspace(scope: string): Workspace;
    saveWorkspace(
      scope: string,
      revision: number,
      files: Workspace["files"],
    ): Workspace;
  };
  let root: string, server: Server, store: LocalStore;
  const requests: Array<{ method: string; path: string; bytes: number }> = [];
  beforeAll(async () => {
    root = mkdtempSync(join(tmpdir(), "eevee-front-storage-"));
    ({ server, store } = createServer({
      root,
      secret,
      storageLimits: { maxFileBytes: 2 * 1024 * 1024, maxProjectBytes: 6 * 1024 * 1024 },
    }));
    server.on("request", (req: IncomingMessage) => {
      const entry = { method: req.method ?? "", path: req.url ?? "", bytes: 0 };
      requests.push(entry);
      req.on("data", (chunk: Buffer) => {
        entry.bytes += chunk.length;
      });
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    (axiosClientWithAuth.get as jest.Mock).mockResolvedValue({
      data: {
        url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
        scope,
        token: issueGrant(secret, scope),
      },
    });
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(root, { recursive: true, force: true });
  });
  it("uploads changed blobs once and sends only immutable metadata to Platform API", async () => {
    const first = {
      assignmentId: 1,
      applicationFileContent: "source",
      files: { "app.ts": "source", "src/util.ts": "utility" },
    };
    const request = await prepareStorageSubmission(first, "submission");
    if (!("sourceSnapshotId" in request))
      throw new Error("Expected reference-only request");
    expect(Object.keys(request).sort()).toEqual([
      "assignmentId",
      "sourceSnapshotId",
    ]);
    expect(store.getSnapshot(scope, request.sourceSnapshotId).kind).toBe(
      "submission",
    );
    expect(
      requests.filter((x) => x.method === "PUT" && x.path.includes("/blobs/")),
    ).toHaveLength(2);
    const changed = {
      ...first,
      files: { ...first.files, "src/util.ts": "utility v2" },
    };
    await prepareStorageSubmission(changed, "preview");
    expect(
      requests.filter((x) => x.method === "PUT" && x.path.includes("/blobs/")),
    ).toHaveLength(3);
    expect(
      store.getSnapshot(scope, request.sourceSnapshotId).files["src/util.ts"]
        .digest,
    ).toBe(hash(Buffer.from("utility")));
  });
  it("syncs and reads files above the old file limit using the server quota", async () => {
    const largeScope = "eevee-u1-a29";
    const grants = axiosClientWithAuth.get as jest.Mock;
    const grant = {
      data: {
        url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
        scope: largeScope,
        token: issueGrant(secret, largeScope),
      },
    };
    grants.mockResolvedValueOnce(grant).mockResolvedValueOnce(grant);
    const files = { "large.ts": "x".repeat(1024 * 1024 + 1) };
    const input = { assignmentId: 29, files, applicationFileContent: "" };
    const { sourceSnapshotId } = await prepareStorageSubmission(input, "submission");
    expect(store.getSnapshot(largeScope, sourceSnapshotId).files["large.ts"].size).toBe(files["large.ts"].length);
    await expect(downloadStorageWorkspace(29)).resolves.toMatchObject({ files });
  });
  it("downloads and verifies the current server workspace without changing local state", async () => {
    const bytes = Buffer.from("export const restored = true;", "utf8");
    store.putBlob(scope, hash(bytes), bytes);
    const current = store.workspace(scope);
    store.saveWorkspace(scope, current.revision, {
      "src/restored.ts": { digest: hash(bytes), size: bytes.length },
    });

    await expect(downloadStorageWorkspace(1)).resolves.toMatchObject({
      files: { "src/restored.ts": "export const restored = true;" },
      revision: current.revision + 1,
    });
  });
  it("autosyncs without snapshots and serializes edits with submissions", async () => {
    const autoScope = "eevee-u1-a17";
    const grants = (axiosClientWithAuth.get as jest.Mock).mockClear();
    grants.mockResolvedValue({
      data: {
        url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
        scope: autoScope,
        token: issueGrant(secret, autoScope),
        expiresAt: Math.floor(Date.now() / 1000) + 300,
      },
    });
    const start = requests.length;
    const files = { "app.js": "\ufefforiginal", "delete.txt": "removed later" };
    const controller = new AbortController();
    const sync = createStorageWorkspaceSync(17, 1, controller.signal);
    await Promise.all([sync(files), sync(files)]);
    expect(grants).toHaveBeenCalledTimes(1);
    expect(store.workspace(autoScope).revision).toBe(1);
    expect(
      requests
        .slice(start)
        .some((request) => request.path.endsWith("/snapshots")),
    ).toBe(false);
    const changed = { "app.js": "\ufeffedited", "renamed.txt": "renamed" };
    const [, submitted] = await Promise.all([
      sync(changed),
      prepareStorageSubmission(
        {
          assignmentId: 17,
          files: changed,
          applicationFileContent: changed["app.js"],
        },
        "submission",
      ),
    ]);
    expect(grants).toHaveBeenCalledTimes(2);
    if (!("sourceSnapshotId" in submitted)) throw Error("Expected snapshot");
    const saved = store.getSnapshot(autoScope, submitted.sourceSnapshotId);
    expect(Object.keys(saved.files).sort()).toEqual(["app.js", "renamed.txt"]);
    expect(saved.files["app.js"].digest).toBe(
      hash(Buffer.from(changed["app.js"])),
    );
    controller.abort();
    await expect(sync({ "app.js": "must not upload" })).rejects.toThrow();
    expect(grants).toHaveBeenCalledTimes(2);
    expect(store.workspace(autoScope).files["app.js"].digest).toBe(
      hash(Buffer.from(changed["app.js"])),
    );
    (axiosClientWithAuth.get as jest.Mock).mockResolvedValue({
      data: {
        url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
        scope,
        token: issueGrant(secret, scope),
      },
    });
  });
  it("keeps an instructor's answer-key draft and run separate from a regular submission", async () => {
    const regular = "eevee-u5-a19";
    const teacher = `${regular}-answer-key`;
    const grants = axiosClientWithAuth.get as jest.Mock;
    grants.mockImplementation(async (route: string) => {
      const answerKeyRoute = "/assignment-storage/19/answer-key/grant";
      expect([answerKeyRoute, "/assignment-storage/19/workspace/grant"]).toContain(route);
      const scope = route === answerKeyRoute ? teacher : regular;
      return {
        data: {
          url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
          scope,
          token: issueGrant(secret, scope),
          expiresAt: Math.floor(Date.now() / 1000) + 300,
        },
      };
    });
    const submitted = { "src/app.ts": "\ufeffsubmitted code" };
    const draft = { "src/app.ts": "answer-key draft" };
    const submission = await prepareStorageSubmission(
      { assignmentId: 19, files: submitted, applicationFileContent: submitted["src/app.ts"] },
      "submission",
    );
    const teacherSync = createStorageWorkspaceSync(19, 5, new AbortController().signal, "answer-key");
    await teacherSync(draft);
    const loaded = await downloadStorageWorkspace(19, { draft: "answer-key", userId: 5 });
    expect(loaded.files).toEqual(draft);
    rememberStorageWorkspace(loaded);
    const run = await prepareAnswerKeyRun(
      { assignmentId: 19, files: draft, applicationFileContent: draft["src/app.ts"] },
      5,
    );
    await saveAnswerKeyDraft({ assignmentId: 19, files: { "src/app.ts": "later draft" } }, 5);

    const snapshot = store.getSnapshot(teacher, run.sourceSnapshotId);
    expect(snapshot.kind).toBe("answer-key");
    expect(snapshot.files["src/app.ts"].digest).toBe(hash(Buffer.from(draft["src/app.ts"])));
    expect(() => store.getSnapshot(regular, run.sourceSnapshotId)).toThrow();
    expect(store.getSnapshot(regular, submission.sourceSnapshotId).kind).toBe("submission");
    const original = await downloadStorageWorkspace(19);
    expect(original.files).toEqual(submitted);
    const zip = unzipSync(new Uint8Array(await createZip(original.files).arrayBuffer()));
    expect(Object.keys(zip)).toEqual(["src/app.ts"]);
    expect(Buffer.from(zip["src/app.ts"])).toEqual(Buffer.from(submitted["src/app.ts"]));
  });
  it("sends a snapshot reference and uploads only changed file contents", async () => {
    const benchmarkScope = "eevee-u1-a2";
    (axiosClientWithAuth.get as jest.Mock).mockResolvedValue({
      data: {
        url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
        scope: benchmarkScope,
        token: issueGrant(secret, benchmarkScope),
      },
    });
    const files = Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [
        i === 0 ? "app.ts" : `src/file-${i}.ts`,
        (`// synthetic file ${i}\n` + "x".repeat(65536)).slice(0, 65536),
      ]),
    );
    const input = {
      assignmentId: 2,
      applicationFileContent: files["app.ts"],
      files,
    };
    const start = requests.length;
    const first = await prepareStorageSubmission(input, "submission");
    const initialRequests = requests.slice(start);
    const secondStart = requests.length;
    const changed = {
      ...input,
      files: {
        ...files,
        "src/file-1.ts": files["src/file-1.ts"].slice(0, -1) + "y",
      },
    };
    const second = await prepareStorageSubmission(changed, "submission");
    const secondRequests = requests.slice(secondStart);
    const blobUploadBytes = (list: typeof requests) =>
      list
        .filter((request) => request.method === "PUT" && request.path.includes("/blobs/"))
        .reduce((n, x) => n + x.bytes, 0);
    expect(blobUploadBytes(initialRequests)).toBe(20 * 65536);
    expect(blobUploadBytes(secondRequests)).toBe(65536);
    expect(Buffer.byteLength(JSON.stringify(first))).toBeLessThan(150);
    expect(Buffer.byteLength(JSON.stringify(second))).toBeLessThan(150);
    (axiosClientWithAuth.get as jest.Mock).mockResolvedValue({
      data: {
        url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
        scope,
        token: issueGrant(secret, scope),
      },
    });
  });
  it("preserves local edits and refuses a remote revision conflict", async () => {
    // Establish an explicitly accepted baseline before another writer changes it.
    rememberStorageWorkspace(await downloadStorageWorkspace(1));
    const remote = store.workspace(scope);
    store.saveWorkspace(scope, remote.revision, {});
    const local = {
      assignmentId: 1,
      applicationFileContent: "offline",
      files: { "app.ts": "offline edit" },
    };
    await expect(prepareStorageSubmission(local, "submission")).rejects.toThrow(
      "Conflito",
    );
    expect(local.files["app.ts"]).toBe("offline edit");
    expect(store.workspace(scope).files).toEqual({});
  });
});
