import { api } from "./api";

export type SheetDataKind = "health" | "medication";

export interface DormitoryOption {
  key: string;
  name: string;
}

export interface SheetRow {
  rowNumber: number;
  studentId?: string;
  cells: string[];
  record: Record<string, string>;
  medications?: Record<string, string>[];
}

export interface SheetDataResponse {
  dormitory: string;
  teacher?: string;
  headers: string[];
  rows: SheetRow[];
  sourceUrl: string;
}

export interface SheetImportResult {
  health: { created: number; updated: number };
  medication: { created: number; updated: number };
}

export async function listSheetDormitories(): Promise<DormitoryOption[]> {
  const { data } = await api.get<{ data: DormitoryOption[] }>(
    "/sheet-data/dormitories",
  );
  return data.data;
}

export async function getSheetData(
  kind: SheetDataKind,
  dormitory: string,
): Promise<SheetDataResponse> {
  const { data } = await api.get<SheetDataResponse>(`/sheet-data/${kind}`, {
    params: { dormitory },
  });
  return data;
}

export async function importStudentsFromSheets(): Promise<SheetImportResult> {
  const { data } = await api.post<SheetImportResult>("/sheet-data/import-students");
  return data;
}

export async function updateSheetTeacher(
  dormitory: string,
  teacher: string,
): Promise<{ dormitory: string; teacher: string }> {
  const { data } = await api.put<{ dormitory: string; teacher: string }>(
    "/sheet-data/teacher",
    { dormitory, teacher },
  );
  return data;
}
