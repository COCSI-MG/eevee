import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import { dirname, resolve } from "node:path";
import { StorageError } from "./errors";

type FileSystem = Pick<
  typeof fs,
  "openSync" | "closeSync" | "fsyncSync" | "existsSync" | "mkdirSync" |
  "writeFileSync" | "renameSync" | "unlinkSync"
>;

function markPersistenceUncertain(error: unknown): void {
  if (error !== null && typeof error === "object") {
    Object.assign(error, { persistenceUncertain: true });
  }
}

export function createDurability(
  io: FileSystem = fs,
  platform: NodeJS.Platform = process.platform,
) {
  function syncDirectory(directory: string): void {
    const descriptor = io.openSync(directory, "r");
    try {
      io.fsyncSync(descriptor);
    } finally {
      io.closeSync(descriptor);
    }
  }

  function assertSupported(target: string): void {
    if (platform === "win32") {
      throw Object.assign(
        new StorageError(
          503,
          "Source storage requires a Linux filesystem that supports directory fsync.",
        ),
        { code: "ERR_STORAGE_DURABILITY_UNSUPPORTED" },
      );
    }

    let directory = resolve(target);
    while (!io.existsSync(directory)) directory = dirname(directory);
    // Probe the actual filesystem before creating or replacing entries.
    syncDirectory(directory);
  }

  function mkdir(directory: string): void {
    if (io.existsSync(directory)) {
      // The directory may exist after an earlier parent flush failed.
      syncDirectory(directory);
      syncDirectory(dirname(directory));
      return;
    }

    const parent = dirname(directory);
    mkdir(parent);
    io.mkdirSync(directory, { mode: 0o700 });
    syncDirectory(parent);
  }

  function atomic(file: string, bytes: string | Uint8Array): void {
    const directory = dirname(file);
    assertSupported(directory);
    mkdir(directory);

    const temporaryFile = `${file}.${randomUUID()}.tmp`;
    let descriptor: number | undefined;
    let created = false;
    let renamed = false;
    try {
      descriptor = io.openSync(temporaryFile, "wx", 0o600);
      created = true;
      io.writeFileSync(descriptor, bytes);
      io.fsyncSync(descriptor);
      io.closeSync(descriptor);
      descriptor = undefined;

      io.renameSync(temporaryFile, file);
      renamed = true;
      syncDirectory(directory);
    } catch (error) {
      if (descriptor !== undefined) {
        try {
          io.closeSync(descriptor);
        } catch {
          // Preserve the write failure when cleanup also fails.
        }
      }
      if (created && !renamed) {
        try {
          io.unlinkSync(temporaryFile);
        } catch {
          // Preserve the write failure when cleanup also fails.
        }
      }
      // A failed directory flush after rename leaves the persisted outcome uncertain.
      if (renamed) markPersistenceUncertain(error);
      throw error;
    }
  }

  function syncExisting(file: string): void {
    assertSupported(dirname(file));
    const descriptor = io.openSync(file, "r");
    try {
      io.fsyncSync(descriptor);
    } finally {
      io.closeSync(descriptor);
    }
    syncDirectory(dirname(file));
  }

  function publishDirectory(stage: string, destination: string): void {
    const parent = dirname(destination);
    assertSupported(parent);
    io.renameSync(stage, destination);
    try {
      syncDirectory(parent);
    } catch (error) {
      markPersistenceUncertain(error);
      throw error;
    }
  }

  return { assertSupported, mkdir, atomic, syncExisting, publishDirectory };
}

export const { assertSupported, mkdir, atomic, syncExisting, publishDirectory } =
  createDurability();
