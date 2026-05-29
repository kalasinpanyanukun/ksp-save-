import { api } from "./api";
import type { Admission, OpdVisit, Referral } from "../types";

export interface DailyReport {
  date: string;
  opdVisits: OpdVisit[];
  admissions: Admission[];
  referrals: Referral[];
  totals: {
    opd: number;
    admissions: number;
    referrals: number;
  };
}

export interface MonthlyReport {
  year: number;
  month: number;
  totals: {
    opd: number;
    admissions: number;
    referrals: number;
    students: number;
    admissionDays: number;
  };
  byDay: { day: number; count: number }[];
  topSymptoms: { symptom: string; count: number }[];
  byClass: { classRoom: string; count: number }[];
  byHospital: { name: string; count: number }[];
}

export interface YearlyReport {
  year: number;
  months: {
    month: number;
    opd: number;
    admissions: number;
    referrals: number;
  }[];
  totals: { opd: number; admissions: number; referrals: number };
}

export interface DashboardStats {
  opdToday: number;
  opdMonth: number;
  activeAdmissions: number;
  referralsMonth: number;
  students: number;
  residentStudents: number;
  homeLeaveStudents: number;
  infirmaryStudents: number;
  studentsWithMedication: number;
  medicationStock: {
    totalTypes: number;
    tablets: number;
    liquids: number;
    ointments: number;
    inhalers: number;
    lowStockTypes: number;
  };
}

export async function getDailyReport(date: string): Promise<DailyReport> {
  const { data } = await api.get<DailyReport>("/reports/daily", {
    params: { date },
  });
  return data;
}

export async function getMonthlyReport(
  year: number,
  month: number,
): Promise<MonthlyReport> {
  const { data } = await api.get<MonthlyReport>("/reports/monthly", {
    params: { year, month },
  });
  return data;
}

export async function getYearlyReport(year: number): Promise<YearlyReport> {
  const { data } = await api.get<YearlyReport>("/reports/yearly", {
    params: { year },
  });
  return data;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>("/reports/statistics");
  return data;
}
