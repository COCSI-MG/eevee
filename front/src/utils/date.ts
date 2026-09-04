export function formatDateTime(
  date: string | null | undefined,
): string {
  if (!date) return "—";

  return new Date(date).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function isoToLocalDatetime(iso: string | null | undefined): string {
  if (!iso) return "";

  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function isDeadlinePassed(
  dueDate: string | null | undefined,
  now = new Date(),
): boolean {
  return Boolean(dueDate && now > new Date(dueDate));
}

export function earliestDate(
  ...dates: Array<string | null | undefined>
): string | null {
  const availableDates = dates.filter((date): date is string => Boolean(date));

  if (availableDates.length === 0) return null;

  return availableDates.reduce((earliest, current) => new Date(current) < new Date(earliest) ? current : earliest);
}
