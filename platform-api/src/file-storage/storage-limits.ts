// Standalone defaults match the storage service; Helm supplies both values
// from sourceStorage.limits to every component in a deployment.
function byteLimit(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer in bytes`);
  }
  return value;
}

// Read lazily: Nest loads the local .env after module imports.
export function storageLimits() {
  return {
    maxFileBytes: byteLimit('STORAGE_MAX_FILE_BYTES', 4 * 1024 * 1024),
    maxProjectBytes: byteLimit('STORAGE_MAX_PROJECT_BYTES', 8 * 1024 * 1024),
  };
}
