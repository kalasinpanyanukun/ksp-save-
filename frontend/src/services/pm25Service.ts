import { api } from "./api";
import type { Pm25MeasurementPoint, Pm25Record } from "../types";

export interface Pm25Input {
  recordDate: string;
  recordTime: string;
  pm25Value?: number;
  measurementPoints?: Pm25MeasurementPoint[];
  notes?: string | null;
}

export interface Pm25ListParams {
  days?: number;
  month?: string;
  from?: string;
  to?: string;
}

export async function listPm25(params: number | Pm25ListParams = 30): Promise<Pm25Record[]> {
  const query = typeof params === "number" ? { days: params } : params;
  const { data } = await api.get<{ data: Pm25Record[] }>("/pm25", {
    params: query,
  });
  return data.data;
}

export async function getPm25(id: string): Promise<Pm25Record> {
  const { data } = await api.get<{ record: Pm25Record }>(`/pm25/${id}`);
  return data.record;
}

export async function createPm25(payload: Pm25Input): Promise<Pm25Record> {
  const { data } = await api.post<{ record: Pm25Record }>("/pm25", payload);
  return data.record;
}

export async function updatePm25(
  id: string,
  payload: Pm25Input,
): Promise<Pm25Record> {
  const { data } = await api.put<{ record: Pm25Record }>(`/pm25/${id}`, payload);
  return data.record;
}

export async function deletePm25(id: string): Promise<void> {
  await api.delete(`/pm25/${id}`);
}
