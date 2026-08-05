import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { resolvePackDir } from "./worker-intellisense";
import WORKER_SOURCE_MAP from "./worker-source-map.json";

type MonacoNamespace = typeof import("monaco-editor");

interface TypePackEntry {
  /** node_modules-relative path, e.g. "node_modules/@types/node/fs.d.ts". */
  path: string;
  content: string;
}

/** Pack dirs whose types are already applied, to avoid refetching. */
const loadedPackDirs = new Set<string>();
/** In-memory cache of fetched packs, keyed by pack dir. */
const packCache = new Map<string, TypePackEntry[]>();

const sourceMap = WORKER_SOURCE_MAP as Record<string, string>;

function toExtraLib(entry: TypePackEntry) {
  const filePath = `file:///${entry.path.replace(/^\/+/, "")}`;
  return { content: entry.content, filePath };
}

export async function applyTypePack(
  monaco: MonacoNamespace,
  workerType?: WorkerType | string,
): Promise<void> {
  if (workerType && !sourceMap[workerType]) return;

  const dir = resolvePackDir(workerType);
  if (loadedPackDirs.has(dir)) return;

  let entries = packCache.get(dir);

  if (!entries) {
    try {
      const response = await fetch(`/type-packs/${dir}/types.json`, {
        cache: "force-cache",
      });
      if (!response.ok) return;
      entries = (await response.json()) as TypePackEntry[];
      packCache.set(dir, entries);
    } catch {
      // No pack available (e.g. offline dev without a generated pack) -> Tier 1.
      return;
    }
  }

  if (!entries.length) {
    loadedPackDirs.add(dir);
    return;
  }

  const extraLibs = entries.map(toExtraLib);
  const { typescriptDefaults, javascriptDefaults } =
    monaco.languages.typescript;

  // setExtraLibs replaces atomically, so switching worker types resets cleanly.
  typescriptDefaults.setExtraLibs(extraLibs);
  javascriptDefaults.setExtraLibs(extraLibs);

  loadedPackDirs.add(dir);
}

/**
 * Clears the applied type pack. Call on editor unmount so a subsequent
 * assignment with a different worker starts from a clean slate.
 */
export function clearTypePacks(monaco: MonacoNamespace): void {
  const { typescriptDefaults, javascriptDefaults } =
    monaco.languages.typescript;
  typescriptDefaults.setExtraLibs([]);
  javascriptDefaults.setExtraLibs([]);
  loadedPackDirs.clear();
}
