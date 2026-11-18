/** @jest-environment node */
import { createHash } from "node:crypto";
import { axiosClientWithAuth } from "../platform-api/client";
import {
  createStorageWorkspaceSync,
  downloadStorageWorkspace,
  prepareStorageSubmission,
  rememberStorageWorkspace,
} from "./source-storage";

jest.mock("../platform-api/client", () => ({ axiosClientWithAuth: { get: jest.fn() } }));
const sha = (value: Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
const response = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    arrayBuffer: async () => Uint8Array.from(body as Uint8Array).buffer,
  }) as Response;
const remote = (text = "remote edit") => {
  const bytes = new TextEncoder().encode(text);
  return {
    version: 1,
    scope: "eevee-u1-a1",
    revision: 1,
    files: { "app.ts": { digest: sha(bytes), size: bytes.length } },
  };
};
const originalFetch = global.fetch;
const grants = axiosClientWithAuth.get as jest.Mock;
let fetchMock: jest.Mock;
beforeEach(() => {
  grants.mockReset().mockResolvedValue({
    data: {
      url: "http://127.0.0.1:3020",
      scope: "eevee-u1-a1",
      token: "synthetic-only",
      expiresAt: Math.floor(Date.now() / 1000) + 300,
    },
  });
  fetchMock = jest.fn();
  global.fetch = fetchMock;
});
afterAll(() => {
  global.fetch = originalFetch;
});

it("reuses the autosave grant until it is near expiry", async () => {
  const now = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
  const scope = "eevee-u3-a2";
  const url = "http://127.0.0.1:3020";
  grants
    .mockResolvedValueOnce({
      data: { url, scope, token: "first", expiresAt: 1_300 },
    })
    .mockResolvedValueOnce({
      data: { url, scope, token: "renewed", expiresAt: 1_570 },
    });
  fetchMock.mockResolvedValue(response({ version: 1, scope, revision: 0, files: {} }));
  const sync = createStorageWorkspaceSync(2, 3, new AbortController().signal);
  try {
    await sync({});
    now.mockReturnValue(1_269_000);
    await sync({});
    expect(grants).toHaveBeenCalledTimes(1);
    now.mockReturnValue(1_270_000);
    await sync({});
    expect(grants).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([, init]) => init.headers.Authorization))
      .toEqual(["Bearer first", "Bearer first", "Bearer renewed"]);
  } finally {
    now.mockRestore();
  }
});

it("renews a rejected grant without replaying a completed workspace step", async () => {
  const scope = "eevee-u3-a3";
  const url = "http://127.0.0.1:3020";
  const expiresAt = Math.floor(Date.now() / 1000) + 300;
  const saved = { ...remote("new"), scope };
  grants
    .mockResolvedValueOnce({ data: { url, scope, token: "first", expiresAt } })
    .mockResolvedValueOnce({ data: { url, scope, token: "renewed", expiresAt } });
  fetchMock
    .mockResolvedValueOnce(response({ ...saved, revision: 0, files: {} }))
    .mockResolvedValueOnce(response({}))
    .mockResolvedValueOnce(response({}, 403))
    .mockResolvedValueOnce(response(saved));
  const sync = createStorageWorkspaceSync(3, 3, new AbortController().signal);
  await expect(sync({ "app.ts": "new" })).resolves.toEqual({ revision: 1 });
  expect(grants).toHaveBeenCalledTimes(2);
  expect(fetchMock).toHaveBeenCalledTimes(4);
  const [rejectedUrl, rejected] = fetchMock.mock.calls[2];
  const [retriedUrl, retried] = fetchMock.mock.calls[3];
  expect(retriedUrl).toBe(rejectedUrl);
  expect(retried.method).toBe("PUT");
  expect(retried.body).toBe(rejected.body);
  expect(retried.headers).toEqual({
    ...rejected.headers,
    Authorization: "Bearer renewed",
  });
  expect(retried.headers["If-Match"]).toBe("0");
});

it("rejects a refreshed grant issued to a different account", async () => {
  const url = "http://127.0.0.1:3020";
  const expiresAt = Math.floor(Date.now() / 1000) + 300;
  grants
    .mockResolvedValueOnce({
      data: { url, scope: "eevee-u3-a4", token: "first", expiresAt },
    })
    .mockResolvedValueOnce({
      data: { url, scope: "eevee-u4-a4", token: "different-user", expiresAt },
    });
  fetchMock.mockResolvedValueOnce(response({}, 403));
  const sync = createStorageWorkspaceSync(4, 3, new AbortController().signal);
  await expect(sync({})).rejects.toThrow("A sessão mudou");
  expect(grants).toHaveBeenCalledTimes(2);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("does not use a grant that arrives after the workspace is closed", async () => {
  const controller = new AbortController();
  grants.mockImplementationOnce(async () => {
    controller.abort();
    return {
      data: {
        url: "http://127.0.0.1:3020",
        scope: "eevee-u3-a5",
        token: "late",
      },
    };
  });
  const sync = createStorageWorkspaceSync(5, 3, controller.signal);
  await expect(sync({})).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each([
  null,
  [],
  { revision: 1 },
  { revision: 1, files: [] },
  { revision: -1, files: {} },
  { revision: 0, files: remote().files },
  { revision: 1, files: { "app.ts": null } },
  { revision: 1, files: { "../app.ts": Object.values(remote().files)[0] } },
  {
    revision: 1,
    files: {
      a: Object.values(remote().files)[0],
      "a/b": Object.values(remote().files)[0],
    },
  },
])("rejects malformed manifests before any blob read: %j", async (value) => {
  fetchMock.mockResolvedValue(
    response(
      value && typeof value === "object" && !Array.isArray(value)
        ? { version: 1, scope: "eevee-u1-a1", ...value }
        : value,
    ),
  );
  await expect(downloadStorageWorkspace(1)).rejects.toThrow();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("verifies downloaded bytes and preserves UTF-8 BOM", async () => {
  const bytes = new TextEncoder().encode("\ufeffexport const value = 1;");
  const manifest = {
    version: 1,
    scope: "eevee-u1-a1",
    revision: 2,
    files: { "src/app.ts": { digest: sha(bytes), size: bytes.length } },
  };
  fetchMock
    .mockResolvedValueOnce(response(manifest))
    .mockResolvedValueOnce(response(bytes));
  await expect(downloadStorageWorkspace(1)).resolves.toMatchObject({
    files: { "src/app.ts": "\ufeffexport const value = 1;" },
  });
});
it("rejects a corrupt blob rather than returning a partial workspace", async () => {
  fetchMock
    .mockResolvedValueOnce(response(remote()))
    .mockResolvedValueOnce(response(new TextEncoder().encode("tampered")));
  await expect(downloadStorageWorkspace(1)).rejects.toThrow("integridade");
});
it("rejects invalid UTF-8 even if its hash is valid", async () => {
  const bytes = new Uint8Array([0xc3, 0x28]);
  fetchMock
    .mockResolvedValueOnce(
      response({
        version: 1,
        scope: "eevee-u1-a1",
        revision: 1,
        files: { "app.ts": { digest: sha(bytes), size: 2 } },
      }),
    )
    .mockResolvedValueOnce(response(bytes));
  await expect(downloadStorageWorkspace(1)).rejects.toThrow("UTF-8");
});
it("reading without accepting revokes an old baseline and cannot overwrite unsent edits", async () => {
  const tree = remote();
  rememberStorageWorkspace({
    baselineKey: "http://127.0.0.1:3020/eevee-u1-a1",
    revision: 1,
    files: { "app.ts": "remote edit" },
  });
  fetchMock
    .mockResolvedValueOnce(response(tree))
    .mockResolvedValueOnce(response(new TextEncoder().encode("remote edit")));
  await downloadStorageWorkspace(1); // caller declines replacing its local work
  fetchMock.mockResolvedValueOnce(response(tree));
  const input = {
    assignmentId: 1,
    applicationFileContent: "local",
    files: { "app.ts": "unsent edit" },
  };
  await expect(prepareStorageSubmission(input, "submission")).rejects.toThrow(
    "remota diferente",
  );
  expect(input.files["app.ts"]).toBe("unsent edit");
  expect(fetchMock.mock.calls.every(([, init]) => !init.method)).toBe(true);
});
it("accepts the reconciled revision but rejects a later CAS conflict without changing local edits", async () => {
  rememberStorageWorkspace({
    baselineKey: "http://127.0.0.1:3020/eevee-u1-a1",
    revision: 1,
    files: { "app.ts": "remote edit" },
  });
  fetchMock
    .mockResolvedValueOnce(response(remote()))
    .mockResolvedValueOnce(response({}))
    .mockResolvedValueOnce(response({}, 409));
  const input = {
    assignmentId: 1,
    applicationFileContent: "local",
    files: { "app.ts": "new local edit" },
  };
  await expect(prepareStorageSubmission(input, "submission")).rejects.toThrow(
    "preservados",
  );
  expect(input.files["app.ts"]).toBe("new local edit");
  expect(fetchMock.mock.calls[2][1].headers["If-Match"]).toBe("1");
});

it("rejects a response for another scope before downloading files", async () => {
  fetchMock.mockResolvedValue(response({ ...remote(), scope: "eevee-u2-a1" }));
  await expect(downloadStorageWorkspace(1)).rejects.toThrow(
    "workspace inválido",
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("a failed reconciliation cannot reuse consent from an earlier visit", async () => {
  rememberStorageWorkspace({
    baselineKey: "http://127.0.0.1:3020/eevee-u1-a1",
    revision: 1,
    files: { "app.ts": "remote edit" },
  });
  fetchMock.mockResolvedValueOnce(response({}, 503));
  await expect(downloadStorageWorkspace(1)).rejects.toThrow("503");
  fetchMock.mockResolvedValueOnce(response(remote()));
  const input = {
    assignmentId: 1,
    applicationFileContent: "local",
    files: { "app.ts": "unsent" },
  };
  await expect(prepareStorageSubmission(input, "submission")).rejects.toThrow(
    "remota diferente",
  );
  expect(fetchMock.mock.calls.every(([, init]) => !init.method)).toBe(true);
});

it("rejects an acknowledgement for different persisted files before snapshot creation", async () => {
  rememberStorageWorkspace({
    baselineKey: "http://127.0.0.1:3020/eevee-u1-a1",
    revision: 1,
    files: { "app.ts": "remote edit" },
  });
  fetchMock
    .mockResolvedValueOnce(response(remote()))
    .mockResolvedValueOnce(response({}))
    .mockResolvedValueOnce(response({ ...remote(), revision: 2 }));
  const input = {
    assignmentId: 1,
    applicationFileContent: "local",
    files: { "app.ts": "new local edit" },
  };
  await expect(prepareStorageSubmission(input, "submission")).rejects.toThrow(
    "workspace diferente",
  );
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(input.files["app.ts"]).toBe("new local edit");
});
it("freezes upload bytes before asynchronous grant acquisition", async () => {
  let release!: (value: unknown) => void;
  (axiosClientWithAuth.get as jest.Mock).mockReturnValueOnce(
    new Promise((done) => {
      release = done;
    }),
  );
  const input = {
    assignmentId: 1,
    applicationFileContent: "original",
    files: { "app.ts": "original" },
  };
  const original = new TextEncoder().encode("original");
  const persisted = {
    version: 1,
    scope: "eevee-u1-a1",
    revision: 1,
    files: { "app.ts": { digest: sha(original), size: original.length } },
  };
  fetchMock
    .mockResolvedValueOnce(response({ ...persisted, revision: 0, files: {} }))
    .mockResolvedValueOnce(response({}))
    .mockResolvedValueOnce(response(persisted))
    .mockResolvedValueOnce(response({ id: "a".repeat(64) }));
  // Reset previous accepted revision through reconciliation before this fresh remote scope.
  const pending = prepareStorageSubmission(input, "submission");
  input.files["app.ts"] = "edited while waiting";
  release({
    data: {
      url: "http://127.0.0.1:3020",
      scope: "eevee-u1-a1-fresh",
      token: "synthetic-only",
    },
  });
  // Make manifest scope match the isolated grant.
  fetchMock.mockReset();
  fetchMock
    .mockResolvedValueOnce(
      response({
        ...persisted,
        scope: "eevee-u1-a1-fresh",
        revision: 0,
        files: {},
      }),
    )
    .mockResolvedValueOnce(response({}))
    .mockResolvedValueOnce(
      response({ ...persisted, scope: "eevee-u1-a1-fresh" }),
    )
    .mockResolvedValueOnce(response({ id: "a".repeat(64) }));
  await expect(pending).resolves.toMatchObject({
    sourceSnapshotId: "a".repeat(64),
  });
  expect(new TextDecoder().decode(fetchMock.mock.calls[1][1].body)).toBe(
    "original",
  );
  expect(input.files["app.ts"]).toBe("edited while waiting");
});
