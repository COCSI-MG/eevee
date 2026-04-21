export function matchesListSearch(
  query: string,
  values: Array<unknown>
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return values.some((v) =>
    String(v ?? "")
      .toLowerCase()
      .includes(q)
  );
}
