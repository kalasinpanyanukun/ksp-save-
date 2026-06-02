export function numberInputToNumber(value: string | number | undefined, fallback = 0) {
  if (value === "" || value == null) return fallback;
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function numberInputToString(value: string | number | null | undefined) {
  if (value == null) return "";
  return String(value);
}
