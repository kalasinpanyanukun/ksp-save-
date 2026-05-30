import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function parseDate(q: unknown, fallback: Date): Date {
  if (typeof q === "string" && q.trim()) {
    const d = new Date(q);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return fallback;
}

function displayText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function jsonRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function hasStudentMedication(student: {
  regularMedication: string | null;
  medicationData: unknown;
}) {
  const regularMedication = displayText(student.regularMedication);
  if (regularMedication && regularMedication !== "-") {
    return true;
  }
  const data = jsonRecord(student.medicationData);
  const medications = Array.isArray(data["รายการยา"])
    ? (data["รายการยา"] as Record<string, unknown>[])
    : [];
  return medications.some((medication) => {
    const name =
      displayText(medication["ข้อมูลยา ชื่อยา"]) ||
      displayText(medication["ชื่อยา"]);
    return Boolean(name && name !== "-");
  });
}

function medicationCategory(medication: {
  drugName: string;
  drugType: string | null;
  unit: string | null;
}) {
  const text = `${medication.drugName} ${medication.drugType ?? ""}`.toLowerCase();
  const unit = medication.unit ?? "";
  if (
    unit.includes("ขวด") ||
    text.includes("น้ำ") ||
    text.includes("syrup")
  ) {
    return "liquid";
  }
  if (
    unit.includes("หลอด") &&
    (text.includes("พ่น") ||
      text.includes("spray") ||
      text.includes("inhaler") ||
      text.includes("nasal"))
  ) {
    return "inhaler";
  }
  if (
    unit.includes("หลอด") &&
    (text.includes("ทา") ||
      text.includes("cream") ||
      text.includes("ointment") ||
      text.includes("gel"))
  ) {
    return "ointment";
  }
  if (
    unit.includes("เม็ด") ||
    text.includes("tablet") ||
    text.includes(" tab") ||
    text.includes("ยาเม็ด")
  ) {
    return "tablet";
  }
  return "other";
}

router.get("/daily", async (req, res, next) => {
  try {
    const date = parseDate(req.query.date, new Date());
    const start = startOfDay(date);
    const end = endOfDay(date);

    const [opdVisits, admissions, referrals] = await Promise.all([
      prisma.opdVisit.findMany({
        where: { visitDate: { gte: start, lte: end } },
        orderBy: { visitTime: "asc" },
        include: {
          student: {
            select: {
              id: true,
              studentCode: true,
              firstName: true,
              lastName: true,
              classRoom: true,
              dormitory: true,
            },
          },
          recordedBy: { select: { fullName: true } },
        },
      }),
      prisma.admission.findMany({
        where: {
          OR: [
            { admitDate: { gte: start, lte: end } },
            { dischargeDate: { gte: start, lte: end } },
          ],
        },
        include: {
          student: {
            select: {
              id: true,
              studentCode: true,
              firstName: true,
              lastName: true,
              classRoom: true,
            },
          },
        },
      }),
      prisma.referral.findMany({
        where: { referralDate: { gte: start, lte: end } },
        include: {
          student: {
            select: {
              id: true,
              studentCode: true,
              firstName: true,
              lastName: true,
              classRoom: true,
            },
          },
        },
      }),
    ]);

    res.json({
      date: start.toISOString(),
      opdVisits,
      admissions,
      referrals,
      totals: {
        opd: opdVisits.length,
        admissions: admissions.length,
        referrals: referrals.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/monthly", async (req, res, next) => {
  try {
    const year = Number(req.query.year ?? new Date().getFullYear());
    const month = Number(req.query.month ?? new Date().getMonth() + 1);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const [opdRows, admissions, referrals, totalActive] = await Promise.all([
      prisma.opdVisit.findMany({
        where: { visitDate: { gte: start, lte: end } },
        select: {
          visitDate: true,
          chiefComplaint: true,
          student: { select: { classRoom: true, dormitory: true } },
        },
      }),
      prisma.admission.findMany({
        where: { admitDate: { gte: start, lte: end } },
        select: { admitDate: true, totalDays: true },
      }),
      prisma.referral.findMany({
        where: { referralDate: { gte: start, lte: end } },
        select: { referredTo: true },
      }),
      prisma.student.count({ where: { isActive: true } }),
    ]);

    // OPD แยกตามวัน
    const daysInMonth = end.getDate();
    const byDay = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      count: 0,
    }));
    for (const v of opdRows) {
      byDay[v.visitDate.getDate() - 1]!.count += 1;
    }

    // อาการที่พบบ่อย (top 10) — กลุ่มตาม keyword หลัก
    const symptomCount: Record<string, number> = {};
    for (const v of opdRows) {
      const key = v.chiefComplaint.trim().split(/[\s,;]/)[0]!.slice(0, 40) || "อื่นๆ";
      symptomCount[key] = (symptomCount[key] ?? 0) + 1;
    }
    const topSymptoms = Object.entries(symptomCount)
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // แยกตามชั้นเรียน
    const byClass: Record<string, number> = {};
    for (const v of opdRows) {
      const k = v.student.classRoom ?? "ไม่ระบุ";
      byClass[k] = (byClass[k] ?? 0) + 1;
    }
    const byClassArr = Object.entries(byClass)
      .map(([classRoom, count]) => ({ classRoom, count }))
      .sort((a, b) => b.count - a.count);

    const referralByHospital: Record<string, number> = {};
    for (const r of referrals) {
      referralByHospital[r.referredTo] =
        (referralByHospital[r.referredTo] ?? 0) + 1;
    }

    res.json({
      year,
      month,
      totals: {
        opd: opdRows.length,
        admissions: admissions.length,
        referrals: referrals.length,
        students: totalActive,
        admissionDays: admissions.reduce((s, a) => s + (a.totalDays ?? 0), 0),
      },
      byDay,
      topSymptoms,
      byClass: byClassArr,
      byHospital: Object.entries(referralByHospital)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/yearly", async (req, res, next) => {
  try {
    const year = Number(req.query.year ?? new Date().getFullYear());
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    const [opdRows, admissions, referrals] = await Promise.all([
      prisma.opdVisit.findMany({
        where: { visitDate: { gte: start, lte: end } },
        select: { visitDate: true, chiefComplaint: true },
      }),
      prisma.admission.findMany({
        where: { admitDate: { gte: start, lte: end } },
        select: { admitDate: true, totalDays: true },
      }),
      prisma.referral.findMany({
        where: { referralDate: { gte: start, lte: end } },
        select: { referralDate: true, referredTo: true },
      }),
    ]);

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      opd: 0,
      admissions: 0,
      referrals: 0,
    }));
    for (const v of opdRows) months[v.visitDate.getMonth()]!.opd += 1;
    for (const a of admissions) months[a.admitDate.getMonth()]!.admissions += 1;
    for (const r of referrals)
      months[r.referralDate.getMonth()]!.referrals += 1;

    res.json({
      year,
      months,
      totals: {
        opd: opdRows.length,
        admissions: admissions.length,
        referrals: referrals.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/common-symptoms", async (req, res, next) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 90)));
    const start = new Date();
    start.setDate(start.getDate() - days);
    const rows = await prisma.opdVisit.findMany({
      where: { visitDate: { gte: start } },
      select: { chiefComplaint: true },
    });
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const key = r.chiefComplaint.trim().split(/[\s,;]/)[0]!.slice(0, 40) || "อื่นๆ";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    res.json({
      days,
      data: Object.entries(counts)
        .map(([symptom, count]) => ({ symptom, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/by-class", async (req, res, next) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 90)));
    const start = new Date();
    start.setDate(start.getDate() - days);
    const rows = await prisma.opdVisit.findMany({
      where: { visitDate: { gte: start } },
      select: { student: { select: { classRoom: true } } },
    });
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const key = r.student.classRoom ?? "ไม่ระบุ";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    res.json({
      days,
      data: Object.entries(counts)
        .map(([classRoom, count]) => ({ classRoom, count }))
        .sort((a, b) => b.count - a.count),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/statistics", async (_req, res, next) => {
  try {
    const today = new Date();
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startDay = startOfDay(today);
    const endDay = endOfDay(today);
    const realStudentWhere = {
      isActive: true,
      NOT: { studentCode: { contains: "-MED-" } },
    } as const;

    const [
      opdToday,
      opdMonth,
      activeAdmissions,
      referralsMonth,
      students,
      residentStudents,
      homeLeaveStudents,
      infirmaryStudents,
      studentsWithMedicationRows,
      medications,
    ] =
      await Promise.all([
        prisma.opdVisit.count({
          where: { visitDate: { gte: startDay, lte: endDay } },
        }),
        prisma.opdVisit.count({ where: { visitDate: { gte: startMonth } } }),
        prisma.admission.count({ where: { dischargeDate: null } }),
        prisma.referral.count({ where: { referralDate: { gte: startMonth } } }),
        prisma.student.count({ where: realStudentWhere }),
        prisma.student.count({
          where: { ...realStudentWhere, studentStatus: "resident" },
        }),
        prisma.student.count({
          where: { ...realStudentWhere, studentStatus: "home_leave" },
        }),
        prisma.student.count({
          where: { ...realStudentWhere, studentStatus: "infirmary" },
        }),
        prisma.student.findMany({
          where: realStudentWhere,
          select: { regularMedication: true, medicationData: true },
        }),
        prisma.medication.findMany({
          where: { isActive: true },
          select: {
            drugName: true,
            drugType: true,
            unit: true,
            stockQty: true,
            minStock: true,
            entryStatus: true,
            category: true,
          },
        }),
      ]);

    const medicationStock = {
      totalTypes: medications.length,
      nonMedicineTypes: medications.filter((m) => m.category === "supply").length,
      tablets: 0,
      liquids: 0,
      ointments: 0,
      inhalers: 0,
      lowStockTypes: medications.filter(
        (medication) =>
          medication.entryStatus === "entered" &&
          medication.stockQty <= medication.minStock,
      ).length,
    };

    for (const medication of medications) {
      if (medication.entryStatus !== "entered") continue;
      const category = medicationCategory(medication);
      if (category === "tablet") medicationStock.tablets += medication.stockQty;
      if (category === "liquid") medicationStock.liquids += medication.stockQty;
      if (category === "ointment") medicationStock.ointments += medication.stockQty;
      if (category === "inhaler") medicationStock.inhalers += medication.stockQty;
    }

    res.json({
      opdToday,
      opdMonth,
      activeAdmissions,
      referralsMonth,
      students,
      residentStudents,
      homeLeaveStudents,
      infirmaryStudents,
      studentsWithMedication: studentsWithMedicationRows.filter(hasStudentMedication)
        .length,
      medicationStock,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
