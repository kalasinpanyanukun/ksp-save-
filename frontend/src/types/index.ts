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

export interface Guardian {
  name: string;
  phone: string;
}

export interface Student {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  classRoom: string | null;
  dormitory: string | null;
  homeroomTeacher: string | null;
  homeroomTeacherPhone: string | null;
  bloodType: BloodType;
  congenitalDisease: string | null;
  drugAllergy: string | null;
  regularMedication: string | null;
  photoUrl: string | null;
  photoPath: string | null;
  photoMimeType: string | null;
  photoSize: number | null;
  healthData: Record<string, unknown>;
  medicationData: Record<string, unknown>;
  guardians: Guardian[];
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

export type StudentHandoffType = "check_in" | "check_out";

export interface StudentHandoff {
  id: string;
  studentId: string;
  handoffType: StudentHandoffType;
  handoffDate: string;
  handoffTime: string;
  companionName: string;
  companionPhone: string | null;
  nurseName: string;
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
  source: string;
  category: "medicine" | "supply";
  unit: string | null;
  stockQty: number;
  minStock: number;
  entryStatus: "entered" | "not_entered";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationMovement {
  id: string;
  medicationId: string;
  delta: number;
  balanceAfter: number;
  reason: string | null;
  recordedById: string | null;
  createdAt: string;
}

export interface MedicationDetail {
  medication: Medication;
  movements: MedicationMovement[];
  students: { id: string; name: string; classRoom: string | null; dormitory: string | null }[];
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
