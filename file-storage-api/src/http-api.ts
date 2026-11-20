import type { IncomingMessage, ServerResponse } from "node:http";
import { fail, StorageError } from "./errors";
import { verifyGrant } from "./grants";
import { isRecord } from "./models";
import type { Store } from "./store";

export interface HttpBodyLimits {
  workspaceBodyBytes: number;
  snapshotBodyBytes: number;
}

interface StorageRequest {
  request: IncomingMessage;
  response: ServerResponse;
  store: Store;
  bodyLimits: HttpBodyLimits;
  scope: string;
  id: string;
}

type Handler = (context: StorageRequest) => void | Promise<void>;

interface Route {
  path: RegExp;
  methods: Readonly<Record<string, Handler | undefined>>;
  snapshotGrant?: boolean;
}

const routes: readonly Route[] = [
  {
    path: /^\/v1\/([a-z0-9-]{1,100})\/workspace$/,
    methods: { GET: readWorkspace, PUT: saveWorkspace },
  },
  {
    path: /^\/v1\/([a-z0-9-]{1,100})\/blobs\/([a-f0-9]{64})$/,
    methods: { GET: readBlob, HEAD: readBlob, PUT: saveBlob },
  },
  {
    path: /^\/v1\/([a-z0-9-]{1,100})\/snapshots$/,
    methods: { POST: createSnapshot },
  },
  {
    path: /^\/v1\/([a-z0-9-]{1,100})\/snapshots\/([a-f0-9]{64})$/,
    methods: { GET: readSnapshot },
  },
  {
    path: /^\/v1\/([a-z0-9-]{1,100})\/snapshots\/([a-f0-9]{64})\/manifest$/,
    methods: { GET: readSnapshotManifest },
  },
  {
    path: /^\/v1\/([a-z0-9-]{1,100})\/snapshots\/([a-f0-9]{64})\/files$/,
    methods: { GET: readSnapshotFiles },
    snapshotGrant: true,
  },
];

function findRoute(url: string): { route: Route; scope: string; id: string } {
  for (const route of routes) {
    const match = route.path.exec(url);
    if (match) return { route, scope: match[1], id: match[2] ?? "" };
  }
  fail(404, "Not found");
}

function sendJson(response: ServerResponse, status: number, value: unknown): void {
  const payload = JSON.stringify(value);
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  response.end(payload);
}

async function readBody(request: IncomingMessage, limit: number): Promise<Buffer> {
  if (Number(request.headers["content-length"]) > limit) {
    fail(413, "Request too large");
  }

  // Keep the socket open long enough to return 413 if a chunk crosses the limit.
  const incoming: AsyncIterable<Buffer> = request.iterator({ destroyOnReturn: false });
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of incoming) {
    size += chunk.length;
    if (size > limit) fail(413, "Request too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

async function readJsonObject(
  request: IncomingMessage,
  limit: number,
): Promise<Record<string, unknown>> {
  const body = await readBody(request, limit);
  let value: unknown;
  try {
    value = JSON.parse(body.toString("utf8"));
  } catch {
    fail(400, "Malformed JSON request");
  }
  if (!isRecord(value)) fail(400, "Expected a JSON object");
  return value;
}

function readWorkspace({ response, store, scope }: StorageRequest): void {
  sendJson(response, 200, { ...store.workspace(scope), limits: store.limits });
}

async function saveWorkspace({
  request,
  response,
  store,
  scope,
  bodyLimits,
}: StorageRequest): Promise<void> {
  const revision = request.headers["if-match"];
  if (typeof revision !== "string" || !/^\d+$/.test(revision)) {
    fail(428, "If-Match revision required");
  }
  const { files } = await readJsonObject(request, bodyLimits.workspaceBodyBytes);
  sendJson(response, 200, store.saveWorkspace(scope, Number(revision), files));
}

function readBlob({ request, response, store, scope, id }: StorageRequest): void {
  const bytes = store.getBlob(scope, id);
  response.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-Length": bytes.length,
  });
  response.end(request.method === "HEAD" ? undefined : bytes);
}

async function saveBlob({ request, response, store, scope, id }: StorageRequest): Promise<void> {
  const bytes = await readBody(request, store.limits.maxFileBytes);
  sendJson(response, 200, store.putBlob(scope, id, bytes));
}

async function createSnapshot({
  request,
  response,
  store,
  scope,
  bodyLimits,
}: StorageRequest): Promise<void> {
  const { revision, kind } = await readJsonObject(request, bodyLimits.snapshotBodyBytes);
  sendJson(response, 201, store.snapshot(scope, revision, kind));
}

function readSnapshot({ response, store, scope, id }: StorageRequest): void {
  sendJson(response, 200, store.getSnapshot(scope, id));
}

function readSnapshotManifest({ response, store, scope, id }: StorageRequest): void {
  sendJson(response, 200, store.getSnapshot(scope, id, { verifyBlobs: false }));
}

function readSnapshotFiles({ response, store, scope, id }: StorageRequest): void {
  const manifest = store.getSnapshot(scope, id, { verifyBlobs: false });
  const files: Record<string, string> = Object.create(null);
  for (const [name, reference] of Object.entries(manifest.files)) {
    const bytes = store.getBlob(scope, reference.digest);
    if (bytes.length !== reference.size) fail(422, "File size mismatch");
    files[name] = bytes.toString("base64");
  }
  sendJson(response, 200, { manifest, files });
}

function sendError(response: ServerResponse, error: unknown): void {
  if (response.destroyed) return;
  if (response.headersSent) {
    response.destroy();
    return;
  }

  if (error instanceof StorageError) {
    if (error.status === 413) response.setHeader("Connection", "close");
    sendJson(response, error.status, { error: error.message });
    return;
  }

  console.error("File Storage API request failed:", error);
  sendJson(response, 500, { error: "Storage operation failed" });
}

export function createRequestHandler(
  store: Store,
  secret: string,
  origins: readonly string[],
  bodyLimits: HttpBodyLimits,
) {
  const allowedOrigins = new Set(origins);
  return async function handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Vary", "Origin");
    const origin = request.headers.origin;
    if (origin && !allowedOrigins.has(origin)) {
      response.writeHead(403).end();
      return;
    }
    if (origin) response.setHeader("Access-Control-Allow-Origin", origin);

    const method = request.method ?? "";
    if (method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Headers": "Authorization, Content-Type, If-Match",
        "Access-Control-Allow-Methods": "GET, HEAD, PUT, POST, OPTIONS",
      }).end();
      return;
    }

    const url = request.url ?? "";
    try {
      if (method === "GET" && url === "/health") {
        sendJson(response, 200, {
          status: "ok",
          mode: "source-storage",
          persistence: "single-host",
        });
        return;
      }

      const { route, scope, id } = findRoute(url);
      const handler = Object.hasOwn(route.methods, method)
        ? route.methods[method]
        : undefined;
      if (!handler) {
        response.setHeader("Allow", Object.keys(route.methods).join(", "));
        fail(405, "Method not allowed");
      }

      verifyGrant(
        secret,
        request.headers.authorization?.replace(/^Bearer /, ""),
        scope,
        method === "GET" || method === "HEAD" ? "read" : "write",
        route.snapshotGrant ? id : undefined,
      );
      await handler({ request, response, store, scope, id, bodyLimits });
    } catch (error) {
      sendError(response, error);
    }
  };
}
