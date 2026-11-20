export class StorageError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "StorageError";
  }
}

export function fail(status: number, message: string): never {
  throw new StorageError(status, message);
}

export function hasErrorCode(error: unknown, code: string): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === code
  );
}
