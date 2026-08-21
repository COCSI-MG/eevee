import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

function normalizeRelativePathForBasePath(
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

/**
 * Creates files and directories based on a flat files map.
 * @param files Flat files map (relativePath -> content).
 * @param currentPath Root path where files should be created.
 */
export async function createFilesAndDirectoriesFromJson(
  files: Record<string, string>,
  currentPath: string
) {
  for (const [relativePath, content] of Object.entries(files)) {
    const rawSanitizedRelativePath = relativePath
      .replace(/^\.\//, "")
      .replace(/^\/+/, "");

    const sanitizedRelativePath = normalizeRelativePathForBasePath(
      rawSanitizedRelativePath,
      currentPath
    );

    if (!sanitizedRelativePath) {
      continue;
    }

    const fullPath = join(currentPath, sanitizedRelativePath);
    const folderPath = dirname(fullPath);

    await mkdir(folderPath, { recursive: true });
    await writeFile(fullPath, content ?? "", { encoding: "utf-8" });
    console.log(`Created file: ${fullPath}`);
  }
}
