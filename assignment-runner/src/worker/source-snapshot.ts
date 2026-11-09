import { createHmac } from "node:crypto";
import type { ExecutionSourceSnapshot } from "@eevee/execution-contracts";

export function workerSourceAccess(snapshot: ExecutionSourceSnapshot) {
  const secret = process.env.EEVEE_STORAGE_SIGNING_SECRET;
  const endpoint = process.env.EEVEE_WORKER_STORAGE_URL;
  if (!endpoint || !secret || secret.length < 32)
    throw new Error("Worker source storage is not configured");
  if (
    !/^eevee-u[1-9]\d*-a[1-9]\d*(?:-answer-key)?$/.test(snapshot.scope) ||
    !/^[a-f0-9]{64}$/.test(snapshot.id) ||
    !["preview", "submission", "answer-key"].includes(snapshot.kind) ||
    snapshot.scope.endsWith("-answer-key") !== (snapshot.kind === "answer-key")
  ) {
    throw new Error("Invalid worker source snapshot");
  }
  const url = new URL(endpoint);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("Invalid worker source storage URL");
  }

  const encoded = Buffer.from(
    JSON.stringify({
      aud: "eevee-file-storage-v1",
      scope: snapshot.scope,
      snapshotId: snapshot.id,
      permissions: ["read"],
      exp: Math.floor(Date.now() / 1000) + 300,
    }),
  ).toString("base64url");
  return {
    ...snapshot,
    url: url.origin,
    token: `${encoded}.${createHmac("sha256", secret).update(encoded).digest("base64url")}`,
  };
}
