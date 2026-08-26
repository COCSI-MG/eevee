import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { getWorkerTypePackDir } from "../worker-editor-config";

type MonacoNamespace = typeof import("monaco-editor");

interface TypePackEntry {
  /** node_modules-relative path, e.g. "node_modules/@types/node/fs.d.ts". */
  path: string;
  content: string;
}

const packCache = new Map<string, TypePackEntry[]>();
const packRequestCache = new Map<string, Promise<TypePackEntry[] | null>>();
let appliedPackDir: string | null = null;
let applicationVersion = 0;

function toExtraLib(entry: TypePackEntry) {
  const filePath = `file:///${entry.path.replace(/^\/+/, "")}`;
  return { content: entry.content, filePath };
}

export async function applyTypePack(
  monaco: MonacoNamespace,
  workerType?: WorkerType | string,
): Promise<void> {
  const dir = getWorkerTypePackDir(workerType);
  if (!dir) {
    clearTypePacks(monaco);
    return;
  }

  if (appliedPackDir === dir) return;

  const requestVersion = ++applicationVersion;
  if (appliedPackDir !== null) {
    const { typescriptDefaults, javascriptDefaults } = monaco.languages.typescript;

    typescriptDefaults.setExtraLibs([]);
    javascriptDefaults.setExtraLibs([]);
    appliedPackDir = null;
  }

  let entries = packCache.get(dir);

  if (!entries) {
    let request = packRequestCache.get(dir);
    if (!request) {
      request = fetch(`/type-packs/${dir}/types.json`, {
        cache: "force-cache",
      })
        .then(async (response) => {

          if (!response.ok) return null;

          const loadedEntries = (await response.json()) as TypePackEntry[];
          packCache.set(dir, loadedEntries);

          return loadedEntries;
        })
        .catch(() => null)
        .finally(() => {
          packRequestCache.delete(dir);
        });
      packRequestCache.set(dir, request);
    }
    entries = (await request) ?? undefined;
  }

  if (requestVersion !== applicationVersion || !entries) return;

  const extraLibs = entries.map(toExtraLib);
  const { typescriptDefaults, javascriptDefaults } = monaco.languages.typescript;

  typescriptDefaults.setExtraLibs(extraLibs);
  javascriptDefaults.setExtraLibs(extraLibs);
  appliedPackDir = dir;
}

export function clearTypePacks(monaco: MonacoNamespace): void {
  applicationVersion += 1;
  const { typescriptDefaults, javascriptDefaults } = monaco.languages.typescript;

  typescriptDefaults.setExtraLibs([]);
  javascriptDefaults.setExtraLibs([]);
  appliedPackDir = null;
}
