import type { AqiLevel, Pm25MeasurementPoint, Pm25Record } from "../types";

export const aqiInfo: Record<AqiLevel, { label: string; color: string; chip: string }> = {
  good: { label: "ดี", color: "#22c55e", chip: "bg-emerald-100 text-emerald-700" },
  moderate: { label: "ปานกลาง", color: "#eab308", chip: "bg-amber-100 text-amber-700" },
  unhealthy_sensitive: {
    label: "เริ่มมีผลต่อผู้ที่ไวต่อมลพิษ",
    color: "#f59e0b",
    chip: "bg-orange-100 text-orange-700",
  },
  unhealthy: {
    label: "มีผลต่อสุขภาพ",
    color: "#ef4444",
    chip: "bg-rose-100 text-rose-700",
  },
  very_unhealthy: {
    label: "มีผลต่อสุขภาพมาก",
    color: "#a855f7",
    chip: "bg-purple-100 text-purple-700",
  },
  hazardous: {
    label: "อันตราย",
    color: "#7f1d1d",
    chip: "bg-rose-200 text-rose-900",
  },
};

export interface NormalizedPm25Point {
  id: string;
  location: string;
  pm25Value: number;
}

export function normalizePm25Points(record: Pm25Record): NormalizedPm25Point[] {
  const raw = Array.isArray(record.measurementPoints)
    ? record.measurementPoints
    : [];
  const points = raw
    .map((point, index) => ({
      id: point.id || `${record.id}-${index + 1}`,
      location: point.location?.trim() || `จุดที่ ${index + 1}`,
      pm25Value: Number(point.pm25Value),
    }))
    .filter((point) => Number.isFinite(point.pm25Value));

  if (points.length > 0) return points;

  const value = Number(record.pm25Value);
  return [
    {
      id: `${record.id}-legacy`,
      location: "จุดวัดหลัก",
      pm25Value: Number.isFinite(value) ? value : 0,
    },
  ];
}

export function averagePm25Points(points: Pick<Pm25MeasurementPoint, "pm25Value">[]): number {
  if (points.length === 0) return 0;
  const total = points.reduce((sum, point) => sum + Number(point.pm25Value || 0), 0);
  return Number((total / points.length).toFixed(2));
}

export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatThaiDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("th-TH");
}

export function formatThaiMonth(value = new Date()): string {
  return value.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
}
