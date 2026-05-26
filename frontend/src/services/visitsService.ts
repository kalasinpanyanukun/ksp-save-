import { api } from "./api";
import type {
  Admission,
  DischargeDestination,
  Medication,
  OpdMedicationItem,
  OpdVisit,
  PageResult,
  Referral,
} from "../types";

// ========== OPD ==========
export interface OpdInput {
  studentId: string;
  visitDate: string;
  visitTime: string;
  chiefComplaint: string;
  diagnosis?: string | null;
  treatment?: string | null;
  medications: OpdMedicationItem[];
  notes?: string | null;
}

export async function listVisits(params: {
  page?: number;
  pageSize?: number;
  date?: string;
  studentId?: string;
}): Promise<PageResult<OpdVisit>> {
  const { data } = await api.get<PageResult<OpdVisit>>("/visits", { params });
  return data;
}

export async function createVisit(payload: OpdInput): Promise<OpdVisit> {
  const { data } = await api.post<{ visit: OpdVisit }>("/visits", payload);
  return data.visit;
}

export async function getVisit(id: string): Promise<OpdVisit> {
  const { data } = await api.get<{ visit: OpdVisit }>(`/visits/${id}`);
  return data.visit;
}

export async function updateVisit(
  id: string,
  payload: Partial<OpdInput>,
): Promise<OpdVisit> {
  const { data } = await api.put<{ visit: OpdVisit }>(`/visits/${id}`, payload);
  return data.visit;
}

export async function deleteVisit(id: string) {
  await api.delete(`/visits/${id}`);
}

// ========== Admissions ==========
export interface AdmissionInput {
  studentId: string;
  admitDate: string;
  admitTime: string;
  chiefComplaint: string;
  dischargeDate?: string | null;
  dischargeTime?: string | null;
  dischargeDestination?: DischargeDestination | null;
  notes?: string | null;
}

export async function listAdmissions(params: {
  page?: number;
  pageSize?: number;
  status?: "active" | "discharged";
  studentId?: string;
}): Promise<PageResult<Admission>> {
  const { data } = await api.get<PageResult<Admission>>("/admissions", { params });
  return data;
}

export async function listActiveAdmissions(): Promise<Admission[]> {
  const { data } = await api.get<{ data: Admission[] }>("/admissions/active");
  return data.data;
}

export async function createAdmission(payload: AdmissionInput): Promise<Admission> {
  const { data } = await api.post<{ admission: Admission }>("/admissions", payload);
  return data.admission;
}

export async function dischargeAdmission(
  id: string,
  payload: {
    dischargeDate: string;
    dischargeTime: string;
    dischargeDestination: DischargeDestination;
    notes?: string | null;
  },
): Promise<Admission> {
  const { data } = await api.put<{ admission: Admission }>(
    `/admissions/${id}/discharge`,
    payload,
  );
  return data.admission;
}

export async function updateAdmission(
  id: string,
  payload: Partial<AdmissionInput>,
): Promise<Admission> {
  const { data } = await api.put<{ admission: Admission }>(
    `/admissions/${id}`,
    payload,
  );
  return data.admission;
}

// ========== Referrals ==========
export interface ReferralInput {
  studentId: string;
  referralDate: string;
  referralTime: string;
  chiefComplaint: string;
  referredTo: string;
  treatmentGiven?: string | null;
  notes?: string | null;
}

export async function listReferrals(params: {
  page?: number;
  pageSize?: number;
  studentId?: string;
}): Promise<PageResult<Referral>> {
  const { data } = await api.get<PageResult<Referral>>("/referrals", { params });
  return data;
}

export async function createReferral(payload: ReferralInput): Promise<Referral> {
  const { data } = await api.post<{ referral: Referral }>("/referrals", payload);
  return data.referral;
}

export async function getReferralSummary(): Promise<{
  total: number;
  byHospital: { name: string; count: number }[];
  byMonth: { month: string; count: number }[];
}> {
  const { data } = await api.get("/referrals/summary");
  return data;
}

// ========== Medications ==========
export interface MedicationInput {
  drugCode: string;
  drugName: string;
  drugType?: string | null;
  unit?: string | null;
  stockQty: number;
  minStock: number;
}

export async function listMedications(params: {
  q?: string;
  lowStock?: boolean;
} = {}): Promise<Medication[]> {
  const { data } = await api.get<{ data: Medication[] }>("/medications", {
    params,
  });
  return data.data;
}

export async function searchMedications(q: string): Promise<Medication[]> {
  if (!q.trim()) return [];
  const { data } = await api.get<{ data: Medication[] }>("/medications/search", {
    params: { q },
  });
  return data.data;
}

export async function createMedication(
  payload: MedicationInput,
): Promise<Medication> {
  const { data } = await api.post<{ medication: Medication }>("/medications", payload);
  return data.medication;
}

export async function updateMedication(
  id: string,
  payload: Partial<MedicationInput>,
): Promise<Medication> {
  const { data } = await api.put<{ medication: Medication }>(
    `/medications/${id}`,
    payload,
  );
  return data.medication;
}

export async function adjustMedication(
  id: string,
  delta: number,
  reason?: string,
): Promise<Medication> {
  const { data } = await api.post<{ medication: Medication }>(
    `/medications/${id}/adjust`,
    { delta, reason },
  );
  return data.medication;
}
