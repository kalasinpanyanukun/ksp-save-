import { api } from "./api";

export type HealthReportType =
  | "disease"
  | "nutrition"
  | "physical"
  | "contraception"
  | "injection";

export interface HealthReport {
  title: string;
  criteria?: string[];
  columns: { header: string; weight?: number }[];
  rows: { studentId: string; cells: string[] }[];
  summary?: { label: string; value: string }[];
}

export async function getHealthReport(type: HealthReportType): Promise<HealthReport> {
  const { data } = await api.get<HealthReport>(`/health-reports/${type}`);
  return data;
}
