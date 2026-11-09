import { createServer as createHttpServer, type Server } from "node:http";
import { createRequestHandler, type HttpBodyLimits } from "./http-api";
import { DEFAULT_STORAGE_LIMITS, Store, type StorageLimits } from "./store";

const LOCAL_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];
const DEFAULT_BODY_LIMITS: HttpBodyLimits = {
  workspaceBodyBytes: 64 * 1024,
  snapshotBodyBytes: 1024,
};

interface ServerOptions {
  root: string;
  secret: string | undefined;
  origins?: readonly string[];
  bodyLimits?: HttpBodyLimits;
  storageLimits?: StorageLimits;
}

export function createServer({
  root,
  secret,
  origins = LOCAL_ORIGINS,
  bodyLimits = DEFAULT_BODY_LIMITS,
  storageLimits,
}: ServerOptions): { server: Server; store: Store } {
  if (!secret || secret.length < 32) {
    throw new Error("EEVEE_STORAGE_SIGNING_SECRET must be at least 32 characters");
  }

  const store = new Store(root, storageLimits);
  const server = createHttpServer(createRequestHandler(store, secret, origins, bodyLimits));
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  return { server, store };
}

function readByteLimit(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const limit = Number(env[name] ?? fallback);
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error(`${name} must be a positive integer in bytes`);
  }
  return limit;
}

function startServer(env: NodeJS.ProcessEnv): void {
  const origins = env.STORAGE_ALLOWED_ORIGINS
    ? env.STORAGE_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : undefined;
  const { server } = createServer({
    root: env.STORAGE_ROOT || ".local/storage",
    secret: env.EEVEE_STORAGE_SIGNING_SECRET,
    origins,
    bodyLimits: {
      workspaceBodyBytes: readByteLimit(
        env,
        "STORAGE_WORKSPACE_BODY_BYTES",
        DEFAULT_BODY_LIMITS.workspaceBodyBytes,
      ),
      snapshotBodyBytes: readByteLimit(
        env,
        "STORAGE_SNAPSHOT_BODY_BYTES",
        DEFAULT_BODY_LIMITS.snapshotBodyBytes,
      ),
    },
    storageLimits: {
      maxFileBytes: readByteLimit(
        env,
        "STORAGE_MAX_FILE_BYTES",
        DEFAULT_STORAGE_LIMITS.maxFileBytes,
      ),
      maxProjectBytes: readByteLimit(
        env,
        "STORAGE_MAX_PROJECT_BYTES",
        DEFAULT_STORAGE_LIMITS.maxProjectBytes,
      ),
    },
  });
  const host = env.STORAGE_HOST || "127.0.0.1";
  const port = Number(env.STORAGE_PORT || 3020);

  process.once("SIGTERM", () => server.close());
  server.listen(port, host, () => {
    const address = server.address();
    if (address && typeof address === "object") {
      console.log(`File Storage API listening on ${address.address}:${address.port}`);
    }
  });
}

if (require.main === module) {
  startServer(process.env);
}
