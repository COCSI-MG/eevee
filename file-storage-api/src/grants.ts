import { createHmac, timingSafeEqual } from "node:crypto";
import { fail } from "./errors";
import { DIGEST_PATTERN, SCOPE_PATTERN, isRecord } from "./models";

// This audience is part of the token format shared with Platform API and Assignment Runner.
const AUDIENCE = "eevee-file-storage-v1";
const MAX_GRANT_SECONDS = 300;

export type GrantPermission = "read" | "write";

interface StorageGrant {
  aud: typeof AUDIENCE;
  scope: string;
  permissions: GrantPermission[];
  exp: number;
  snapshotId?: string;
}

function isPermission(value: unknown): value is GrantPermission {
  return value === "read" || value === "write";
}

function isStorageGrant(value: unknown): value is StorageGrant {
  return (
    isRecord(value) &&
    value.aud === AUDIENCE &&
    typeof value.scope === "string" &&
    SCOPE_PATTERN.test(value.scope) &&
    Array.isArray(value.permissions) &&
    value.permissions.every(isPermission) &&
    typeof value.exp === "number" &&
    Number.isInteger(value.exp) &&
    (value.snapshotId === undefined ||
      (typeof value.snapshotId === "string" && DIGEST_PATTERN.test(value.snapshotId)))
  );
}

function sign(secret: string, payload: string): Buffer {
  return createHmac("sha256", secret).update(payload).digest();
}

export function issueGrant(
  secret: string,
  scope: string,
  permissions: GrantPermission[] = ["read", "write"],
  ttl = MAX_GRANT_SECONDS,
): string {
  if (!SCOPE_PATTERN.test(scope)) fail(400, "Invalid scope");

  const grant: StorageGrant = {
    aud: AUDIENCE,
    scope,
    permissions,
    exp: Math.floor(Date.now() / 1000) + ttl,
  };
  const payload = Buffer.from(JSON.stringify(grant)).toString("base64url");
  return `${payload}.${sign(secret, payload).toString("base64url")}`;
}

export function verifyGrant(
  secret: string,
  token: string | undefined,
  scope: string,
  permission: GrantPermission,
  snapshotId?: string,
): StorageGrant {
  const [payload, signature, ...extra] = token?.split(".") ?? [];
  if (!payload || !signature || extra.length > 0) {
    fail(403, "Storage grant denied");
  }

  const expected = sign(secret, payload);
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    fail(403, "Storage grant denied");
  }

  let grant: unknown;
  try {
    grant = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    fail(403, "Storage grant denied");
  }

  const now = Date.now() / 1000;
  if (
    !isStorageGrant(grant) ||
    grant.scope !== scope ||
    grant.snapshotId !== snapshotId ||
    grant.exp <= now ||
    grant.exp > now + MAX_GRANT_SECONDS + 1 ||
    !grant.permissions.includes(permission)
  ) {
    fail(403, "Storage grant denied");
  }
  return grant;
}
