import { api } from "./api";
import type { PageResult, StudentHandoff, StudentHandoffType } from "../types";

export interface StudentHandoffInput {
  studentId: string;
  handoffType: StudentHandoffType;
  handoffDate: string;
  handoffTime: string;
  companionName: string;
  companionPhone?: string | null;
  nurseName?: string | null;
  notes?: string | null;
}

export interface StudentHandoffSummary {
  today: { checkIn: number; checkOut: number };
  month: { checkIn: number; checkOut: number };
  year: { checkIn: number; checkOut: number };
  byDay: { day: number; checkIn: number; checkOut: number }[];
  byMonth: { month: number; checkIn: number; checkOut: number }[];
}

export async function listStudentHandoffs(params: {
  page?: number;
  pageSize?: number;
  type?: StudentHandoffType;
  q?: string;
  from?: string;
  to?: string;
  studentId?: string;
} = {}): Promise<PageResult<StudentHandoff>> {
  const { data } = await api.get<PageResult<StudentHandoff>>(
    "/student-handoffs",
    { params },
  );
  return data;
}

export async function createStudentHandoff(
  payload: StudentHandoffInput,
): Promise<StudentHandoff> {
  const { data } = await api.post<{ handoff: StudentHandoff }>(
    "/student-handoffs",
    payload,
  );
  return data.handoff;
}

export async function getStudentHandoffSummary(params: {
  year?: number;
  month?: number;
} = {}): Promise<StudentHandoffSummary> {
  const { data } = await api.get<StudentHandoffSummary>(
    "/student-handoffs/summary",
    { params },
  );
  return data;
}
