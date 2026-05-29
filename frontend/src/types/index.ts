export type UserRole = "super_admin" | "admin" | "nurse_assistant";

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export type BloodType = "A" | "B" | "AB" | "O" | "unknown";
export type StudentStatus = "resident" | "infirmary" | "home_leave";

export interface Student {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  classRoom: string | null;
  dormitory: string | null;
  homeroomTeacher: string | null;
  bloodType: BloodType;
  congenitalDisease: string | null;
  drugAllergy: string | null;
  regularMedication: string | null;
  healthData: Record<string, unknown>;
  medicationData: Record<string, unknown>;
  parentName: string | null;
  parentPhone: string | null;
  studentStatus: StudentStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DischargeDestination = "dormitory" | "home" | "hospital" | "other";

export interface OpdMedicationItem {
  drugId?: string;
  drugName: string;
  dose?: string;
  qty?: number;
}

export interface OpdVisit {
  id: string;
  studentId: string;
  visitDate: string;
  visitTime: string;
  chiefComplaint: string;
  diagnosis: string | null;
  treatment: string | null;
  medications: OpdMedicationItem[];
  notes: string | null;
  recordedById: string;
  createdAt: string;
  updatedAt: string;
  student?: Student;
  recordedBy?: { id: string; fullName: string };
}

export interface Admission {
  id: string;
  studentId: string;
  admitDate: string;
  admitTime: string;
  chiefComplaint: string;
  dischargeDate: string | null;
  dischargeTime: string | null;
  dischargeDestination: DischargeDestination | null;
  totalDays: number | null;
  notes: string | null;
  recordedById: string;
  createdAt: string;
  updatedAt: string;
  student?: Student;
  recordedBy?: { id: string; fullName: string };
}

export interface Referral {
  id: string;
  studentId: string;
  referralDate: string;
  referralTime: string;
  chiefComplaint: string;
  referredTo: string;
  treatmentGiven: string | null;
  notes: string | null;
  recordedById: string;
  createdAt: string;
  updatedAt: string;
  student?: Student;
  recordedBy?: { id: string; fullName: string };
}

export interface Medication {
  id: string;
  drugCode: string;
  drugName: string;
  drugType: string | null;
  unit: string | null;
  stockQty: number;
  minStock: number;
  entryStatus: "entered" | "not_entered";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AqiLevel =
  | "good"
  | "moderate"
  | "unhealthy_sensitive"
  | "unhealthy"
  | "very_unhealthy"
  | "hazardous";

export interface Pm25Record {
  id: string;
  recordDate: string;
  recordTime: string;
  pm25Value: string | number;
  aqiLevel: AqiLevel;
  notes: string | null;
  recordedById: string;
  createdAt: string;
  recordedBy?: { id?: string; fullName: string } | null;
}

export interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
