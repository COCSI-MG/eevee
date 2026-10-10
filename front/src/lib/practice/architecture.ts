export function parseBase(value: string, base: number): number {
  const digits =
    base === 2
      ? /^[01]+(?:\.[01]+)?$/
      : base === 16
        ? /^[\da-f]+(?:\.[\da-f]+)?$/i
        : /^\d+(?:\.\d+)?$/;
  const input = value.trim();
  if (input.length > 32 || !digits.test(input))
    throw new Error(
      "Informe um número positivo válido na base selecionada. Use ponto para frações.",
    );
  const [whole, fraction = ""] = input.split(".");
  const result =
    parseInt(whole, base) +
    [...fraction].reduce(
      (sum, digit, index) => sum + parseInt(digit, base) / base ** (index + 1),
      0,
    );
  if (!Number.isFinite(result) || result > Number.MAX_SAFE_INTEGER)
    throw new Error("Use valores menores para manter a precisão.");
  return result;
}
export const STORAGE_UNITS: Record<string, number> = {
  bit: 1 / 8,
  nibble: 1 / 2,
  B: 1,
  KB: 1000,
  KiB: 1024,
  MB: 1000000,
  MiB: 1048576,
  GB: 1000000000,
  GiB: 1073741824,
};
export function toBytes(value: string, unit: string): number {
  const parsed = Number(value);
  if (
    !value.trim() ||
    !Number.isFinite(parsed) ||
    parsed < 0 ||
    !STORAGE_UNITS[unit]
  )
    throw new Error("Informe uma quantidade válida.");
  const result = parsed * STORAGE_UNITS[unit];
  if (result > Number.MAX_SAFE_INTEGER)
    throw new Error("Use uma quantidade menor.");
  return result;
}
export function matchesExpected(value: number, expected: string): boolean {
  const target = Number(expected);
  return (
    Number.isFinite(value) &&
    Number.isFinite(target) &&
    Math.abs(value - target) <= 1e-10 * Math.max(1, Math.abs(target))
  );
}
