import { ImportCompletionPolicy } from "../worker-editor-config";

const EXTENSIONLESS_SCRIPT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
]);

const MODULE_SCRIPT_EXTENSIONS = new Set([
  ".mts",
  ".cts",
  ".mjs",
  ".cjs",
]);

export function normalizeWorkspacePath(path: string): string {
  return path.split("/").filter(Boolean).join("/");
}

function fileExtension(path: string): string {
  const fileName = normalizeWorkspacePath(path).split("/").at(-1) ?? "";

  const extensionIndex = fileName.lastIndexOf(".");

  if (extensionIndex < 0) return "";

  return fileName.slice(extensionIndex).toLowerCase();
}

function isImportableTarget(
  path: string,
  policy: ImportCompletionPolicy,
): boolean {
  if (policy === "none") return false;

  const extension = fileExtension(path);
  if (
    EXTENSIONLESS_SCRIPT_EXTENSIONS.has(extension) ||
    MODULE_SCRIPT_EXTENSIONS.has(extension) ||
    extension === ".json"
  ) {
    return true;
  }

  return policy === "web" && extension === ".css";
}

function toImportPath(fromFilePath: string, targetFilePath: string): string {
  const fromDirParts = normalizeWorkspacePath(fromFilePath)
    .split("/")
    .slice(0, -1);

  const targetParts = normalizeWorkspacePath(targetFilePath).split("/");

  let commonPrefixLength = 0;
  while (
    commonPrefixLength < fromDirParts.length &&
    commonPrefixLength < targetParts.length &&
    fromDirParts[commonPrefixLength] === targetParts[commonPrefixLength]
  ) {
    commonPrefixLength += 1;
  }

  const upSegments = new Array(fromDirParts.length - commonPrefixLength).fill("..");

  const downSegments = targetParts.slice(commonPrefixLength);

  let relativePath = [...upSegments, ...downSegments].join("/");

  if (!relativePath.startsWith(".")) relativePath = `./${relativePath}`;

  if (EXTENSIONLESS_SCRIPT_EXTENSIONS.has(fileExtension(targetFilePath))) {
    return relativePath
      .replace(/\.(tsx|ts|jsx|js)$/i, "")
      .replace(/\/index$/, "");
  }

  return relativePath;
}

export function getImportPathSuggestions(
  fromFilePath: string,
  targetFilePaths: Iterable<string>,
  policy: ImportCompletionPolicy,
  typedValue = "",
): string[] {
  const currentPath = normalizeWorkspacePath(fromFilePath);
  const normalizedTypedValue = typedValue.trim();

  return Array.from(
    new Set(
      Array.from(targetFilePaths)
        .map(normalizeWorkspacePath)
        .filter(
          (path) =>
            path !== currentPath && isImportableTarget(path, policy),
        )
        .map((path) => toImportPath(currentPath, path)),
    ),
  )
    .filter((candidate) =>
      normalizedTypedValue
        ? candidate.startsWith(normalizedTypedValue)
        : candidate.startsWith("."),
    )
    .sort((left, right) => left.localeCompare(right));
}
