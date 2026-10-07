import { zipSync } from "fflate";

const encoder = new TextEncoder();

export function createZip(files: Record<string, string>): Blob {
  const entries: Record<string, Uint8Array> = {}

  for (const [rawPath, content] of Object.entries(files)) {
    const path = rawPath.replaceAll("\\", "/").replace(/^\/+/, "")
    const parts = path.split("/")

    if (!path || parts.some((part) => !part || part === "." || part === "..")) {
      continue
    }

    entries[path] = encoder.encode(content)
  }

  return new Blob([zipSync(entries)], { type: "application/zip" })
}
