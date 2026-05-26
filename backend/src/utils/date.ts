export function dateOnly(input: string | Date): Date {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function diffDaysInclusive(start: Date, end: Date): number {
  const s = dateOnly(start).getTime();
  const e = dateOnly(end).getTime();
  return Math.max(1, Math.floor((e - s) / 86_400_000) + 1);
}
