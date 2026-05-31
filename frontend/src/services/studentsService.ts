import { api } from "./api";
import type { Admission, OpdVisit, PageResult, Referral, Student } from "../types";

export interface MedicationEntryInput {
  name: string;
  morning?: string;
  noon?: string;
  evening?: string;
  bedtime?: string;
}

export interface GuardianInput {
  name: string;
  phone: string;
}

export interface HealthExtraInput {
  weight?: string;
  height?: string;
  bmi?: string;
  bmiResult?: string;
  healthRight?: string;
  vaccineBasic?: string;
  vaccineFlu?: string;
  vaccineCovid?: string;
  disabilityType?: string;
  ageType?: string;
  idCard?: string;
  address?: string;
}

export interface StudentInput {
  studentCode: string;
  firstName: string;
  lastName: string;
  nickname?: string | null;
  classRoom?: string | null;
  dormitory?: string | null;
  homeroomTeacher?: string | null;
  homeroomTeacherPhone?: string | null;
  bloodType?: Student["bloodType"];
  congenitalDisease?: string | null;
  drugAllergy?: string | null;
  regularMedication?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  studentStatus?: Student["studentStatus"];
  medications?: MedicationEntryInput[];
  guardians?: GuardianInput[];
  healthExtra?: HealthExtraInput;
}

export interface ListStudentsParams {
  q?: string;
  classRoom?: string;
  dormitory?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listStudents(
  params: ListStudentsParams = {},
): Promise<PageResult<Student>> {
  const { data } = await api.get<PageResult<Student>>("/students", { params });
  return data;
}

export async function searchStudents(q: string): Promise<Student[]> {
  if (!q.trim()) return [];
  const { data } = await api.get<{ data: Student[] }>("/students/search", {
    params: { q },
  });
  return data.data;
}

export interface StudentDetail extends Student {
  opdVisits: OpdVisit[];
  admissions: Admission[];
  referrals: Referral[];
}

export async function getStudent(id: string): Promise<StudentDetail> {
  const { data } = await api.get<{ student: StudentDetail }>(`/students/${id}`);
  return data.student;
}

export async function createStudent(payload: StudentInput): Promise<Student> {
  const { data } = await api.post<{ student: Student }>("/students", payload);
  return data.student;
}

export async function updateStudent(
  id: string,
  payload: Partial<StudentInput>,
): Promise<Student> {
  const { data } = await api.put<{ student: Student }>(`/students/${id}`, payload);
  return data.student;
}

export async function deleteStudent(id: string): Promise<void> {
  await api.delete(`/students/${id}`);
}

export async function fetchClassrooms(): Promise<string[]> {
  const { data } = await api.get<{ data: string[] }>(
    "/students/distinct/classrooms",
  );
  return data.data;
}

export async function fetchDormitories(): Promise<string[]> {
  const { data } = await api.get<{ data: string[] }>(
    "/students/distinct/dormitories",
  );
  return data.data;
}

export interface ImportResult {
  created: number;
  updated: number;
  errors: { studentCode: string; message: string }[];
}

export async function importStudents(
  items: StudentInput[],
): Promise<ImportResult> {
  const { data } = await api.post<ImportResult>("/students/import", { items });
  return data;
}
