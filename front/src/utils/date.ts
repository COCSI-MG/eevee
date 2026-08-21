export function formatDateTime(
  date: string | null | undefined,
): string {
  if (!date) return "—";

  return new Date(date).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
