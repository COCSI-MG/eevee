export function normalizeString(value?: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}
