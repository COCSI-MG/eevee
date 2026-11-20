import { randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { assertSupported, atomic, mkdir, publishDirectory } from "./durability";
import { fail } from "./errors";
import { isRecord, type FileManifest } from "./models";
import { Store, hash, validateFilePath } from "./store";

function listFiles(root: string, relative = ""): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(join(root, relative), { withFileTypes: true })) {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...listFiles(root, name));
    } else if (entry.isFile()) {
      files.push(name);
    } else {
      fail(422, entry.isSymbolicLink() ? "Symlink rejected" : "Unsupported file type");
    }
  }
  return files.sort();
}

function discardStage(stage: string): void {
  try {
    rmSync(stage, { recursive: true, force: true });
  } catch {
    // Preserve the error that stopped the backup or restore.
  }
}

export function backup(store: Store, destination: string): {
  destination: string;
  files: number;
} {
  // Stop the writer first so the manifest and blobs come from one checkpoint.
  const target = resolve(destination);
  if (target === store.root || target.startsWith(store.root + sep)) {
    fail(400, "Backup must be outside source");
  }
  if (existsSync(target)) fail(409, "Backup destination already exists");
  store.verify();

  const stage = `${target}.${randomUUID()}.partial`;
  const data = join(stage, "data");
  assertSupported(dirname(target));
  try {
    mkdir(data);
    const index: FileManifest = Object.create(null);
    for (const name of listFiles(store.root)) {
      const bytes = readFileSync(join(store.root, name));
      index[name] = { digest: hash(bytes), size: bytes.length };
      atomic(join(data, name), bytes);
    }
    atomic(join(stage, "backup.json"), JSON.stringify({ version: 1, files: index }));
    new Store(data).verify();
    publishDirectory(stage, target);
    return { destination: target, files: Object.keys(index).length };
  } catch (error) {
    discardStage(stage);
    throw error;
  }
}

export function restore(source: string, destination: string): Store {
  const target = resolve(destination);
  if (existsSync(target)) fail(409, "Restore requires a new destination");

  const manifest: unknown = JSON.parse(readFileSync(join(source, "backup.json"), "utf8"));
  if (!isRecord(manifest) || manifest.version !== 1 || !isRecord(manifest.files)) {
    fail(422, "Invalid backup");
  }
  const data = join(source, "data");
  const names = listFiles(data);
  const expected = Object.keys(manifest.files).sort();
  if (names.length !== expected.length || names.some((name, index) => name !== expected[index])) {
    fail(422, "Backup file set mismatch");
  }

  const stage = `${target}.${randomUUID()}.partial`;
  assertSupported(dirname(target));
  try {
    mkdir(stage);
    for (const name of names) {
      validateFilePath(name);
      const bytes = readFileSync(join(data, name));
      const reference = manifest.files[name];
      if (!isRecord(reference) || bytes.length !== reference.size || hash(bytes) !== reference.digest) {
        fail(422, "Backup integrity failure");
      }
      atomic(join(stage, name), bytes);
    }
    new Store(stage).verify();
    publishDirectory(stage, target);
  } catch (error) {
    discardStage(stage);
    throw error;
  }
  return new Store(target);
}

function run(args: string[]): void {
  const [action, source, destination] = args;
  if (!source || !destination || (action !== "backup" && action !== "restore")) {
    throw new Error("Usage: node dist/backup.js backup|restore SOURCE NEW_DESTINATION");
  }
  if (!existsSync(source) || !statSync(source).isDirectory()) {
    throw new Error("Source directory does not exist");
  }
  if (action === "backup") {
    console.log(JSON.stringify(backup(new Store(source), destination)));
  } else {
    restore(source, destination);
    console.log(JSON.stringify({ restored: destination, verified: true }));
  }
}

if (require.main === module) {
  try {
    run(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
