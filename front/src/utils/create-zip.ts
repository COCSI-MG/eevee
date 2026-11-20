import { zipSync } from "fflate";

export function createZip(files: Record<string, string>): Blob {
  const encoder = new TextEncoder();
  const entries: Record<string, Uint8Array> = Object.create(null);
  for (const [rawPath, content] of Object.entries(files)) {
    const path = rawPath.replaceAll("\\", "/").replace(/^\/+/, "");
    if (path.includes(":") || path.split("/").some((part) => !part || part === "." || part === "..")) {
      continue;
    }
    entries[path] = encoder.encode(content);
  }
  return new Blob([zipSync(entries)], { type: "application/zip" });
}
