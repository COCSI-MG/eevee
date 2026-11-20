import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

export function normalizeRelativePathForBasePath(
  relativePath: string,
  currentPath: string
) {
  const baseSegments = currentPath.split("/").filter(Boolean);
  const relativeSegments = relativePath.split("/").filter(Boolean);

  const maxPrefixSize = Math.min(3, baseSegments.length, relativeSegments.length);

  for (let prefixSize = maxPrefixSize; prefixSize >= 1; prefixSize -= 1) {
    const baseTail = baseSegments.slice(-prefixSize);
    const relativeHead = relativeSegments.slice(0, prefixSize);
    const isSamePrefix = baseTail.every(
      (segment, index) => segment === relativeHead[index]
    );

    if (!isSamePrefix) {
      continue;
    }

    const remaining = relativeSegments.slice(prefixSize).join("/");
    if (remaining) {
      return remaining;
    }
  }

  return relativePath;
}

/** Returns the exact relative destination used by the writer, or rejects it. */
export function normalizedFileDestination(relativePath: string, currentPath: string) {
  const raw = relativePath.replace(/^\.\//, "").replace(/^\/+/, "");
  const normalized = normalizeRelativePathForBasePath(raw, currentPath);
  if (
    !normalized ||
    normalized.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error(`Unsafe worker file path: ${relativePath}`);
  }
  return normalized;
}

/**
 * Creates files and directories based on a flat files map.
 * @param files Flat files map (relativePath -> content).
 * @param currentPath Root path where files should be created.
 */
export async function createFilesAndDirectoriesFromJson(
  files: Record<string, string | Buffer>,
  currentPath: string
) {
  for (const [relativePath, content] of Object.entries(files)) {
    const sanitizedRelativePath = normalizedFileDestination(relativePath, currentPath);

    const fullPath = join(currentPath, sanitizedRelativePath);
    const folderPath = dirname(fullPath);

    await mkdir(folderPath, { recursive: true });
    await writeFile(fullPath, content ?? "");
    console.log(`Created file: ${fullPath}`);
  }
}
