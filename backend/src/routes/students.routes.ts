import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/rbac.middleware.js";
import { HttpError } from "../middleware/error.middleware.js";

const router = Router();
router.use(authMiddleware);

const bloodTypes = ["A", "B", "AB", "O", "unknown"] as const;
const studentStatuses = ["resident", "infirmary", "home_leave"] as const;

const medicationEntrySchema = z.object({
  name: z.string().trim().min(1).max(200),
  morning: z.string().trim().max(100).optional().default(""),
  noon: z.string().trim().max(100).optional().default(""),
  evening: z.string().trim().max(100).optional().default(""),
  bedtime: z.string().trim().max(100).optional().default(""),
});

type MedicationEntryInput = z.infer<typeof medicationEntrySchema>;

const guardianSchema = z.object({
  name: z.string().trim().max(100).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
});
type GuardianInput = z.infer<typeof guardianSchema>;

const healthExtraSchema = z.object({
  weight: z.string().trim().max(20).optional(),
  height: z.string().trim().max(20).optional(),
  bmi: z.string().trim().max(20).optional(),
  bmiResult: z.string().trim().max(60).optional(),
  healthRight: z.string().trim().max(100).optional(),
  vaccineBasic: z.string().trim().max(60).optional(),
  vaccineFlu: z.string().trim().max(60).optional(),
  vaccineCovid: z.string().trim().max(60).optional(),
});
type HealthExtraInput = z.infer<typeof healthExtraSchema>;

const studentSchema = z.object({
  studentCode: z.string().trim().min(1, "กรุณากรอกรหัสนักเรียน").max(20),
  firstName: z.string().trim().min(1, "กรุณากรอกชื่อ").max(100),
  lastName: z.string().trim().min(1, "กรุณากรอกนามสกุล").max(100),
  nickname: z.string().trim().max(50).optional().nullable(),
  classRoom: z.string().trim().max(20).optional().nullable(),
  dormitory: z.string().trim().max(50).optional().nullable(),
  homeroomTeacher: z.string().trim().max(100).optional().nullable(),
  homeroomTeacherPhone: z.string().trim().max(20).optional().nullable(),
  bloodType: z.enum(bloodTypes).optional(),
  congenitalDisease: z.string().trim().max(2000).optional().nullable(),
  drugAllergy: z.string().trim().max(2000).optional().nullable(),
  regularMedication: z.string().trim().max(2000).optional().nullable(),
  parentName: z.string().trim().max(100).optional().nullable(),
  parentPhone: z.string().trim().max(20).optional().nullable(),
  studentStatus: z.enum(studentStatuses).optional(),
  isActive: z.boolean().optional(),
  medications: z.array(medicationEntrySchema).optional(),
  guardians: z.array(guardianSchema).optional(),
  healthExtra: healthExtraSchema.optional(),
});

/** ผู้ปกครองหลายคน → เก็บ guardians[] + ซิงก์ parentName/parentPhone เป็นคนแรก */
function guardianFields(guardians: GuardianInput[] | undefined) {
  if (!guardians) return null;
  const list = guardians
    .map((g) => ({ name: (g.name ?? "").trim(), phone: (g.phone ?? "").trim() }))
    .filter((g) => g.name || g.phone);
  return {
    guardians: list as unknown as Prisma.InputJsonValue,
    parentName: list[0]?.name || null,
    parentPhone: list[0]?.phone || null,
  };
}

/** รวมข้อมูลสุขภาพเพิ่มเติม (น้ำหนัก/ส่วนสูง/BMI/สิทธิ/วัคซีน) เข้ากับ healthData เดิม */
function mergeHealthExtra(
  extra: HealthExtraInput | undefined,
  current: Prisma.JsonValue | null | undefined,
) {
  if (!extra) return null;
  const data: Record<string, unknown> =
    current && typeof current === "object" && !Array.isArray(current)
      ? { ...(current as Record<string, unknown>) }
      : {};
  const set = (key: string, value: string | undefined) => {
    if (value === undefined) return;
    if (value.trim()) data[key] = value.trim();
    else delete data[key];
  };
  set("น้ำหนัก (กิโลกรัม)", extra.weight);
  set("ส่วนสูง (เซนติเมตร)", extra.height);
  let bmi = extra.bmi;
  if ((!bmi || !bmi.trim()) && extra.weight && extra.height) {
    const w = parseFloat(extra.weight);
    const h = parseFloat(extra.height) / 100;
    if (w > 0 && h > 0) bmi = (w / (h * h)).toFixed(2);
  }
  set("คะแนน BMI", bmi);
  set("แปลผล BMI", extra.bmiResult);
  set("สิทธิ", extra.healthRight);
  set("ได้รับวัคซีนพื้นฐาน(สมุดชมพู) ครบ/ไม่ครบ", extra.vaccineBasic);
  set("ฉีดวัคซีน ป้องกันไข้หวัดใหญ่ (ปี)", extra.vaccineFlu);
  set("ฉีดวัคซีน ป้องกันโควิค (ปี)", extra.vaccineCovid);
  // ให้เมนูสุขภาพมองเห็นว่ามาจากชีตสุขภาพ
  if (!data["แหล่งข้อมูล"]) data["แหล่งข้อมูล"] = "ข้อมูลสุขภาพนักเรียน";
  return data as Prisma.InputJsonObject;
}

/** สร้าง medicationData (JSON) + regularMedication (สรุปข้อความ) จากรายการยาที่กรอกในฟอร์ม */
function buildMedicationFields(
  entries: MedicationEntryInput[] | undefined,
  dormitory?: string | null,
) {
  if (!entries) return null;
  const list = entries
    .filter((m) => m.name.trim())
    .map((m) => {
      const entry: Record<string, string> = { ชื่อยา: m.name.trim() };
      if (m.morning?.trim()) entry["เช้า"] = m.morning.trim();
      if (m.noon?.trim()) entry["เที่ยง"] = m.noon.trim();
      if (m.evening?.trim()) entry["เย็น"] = m.evening.trim();
      if (m.bedtime?.trim()) entry["ก่อนนอน"] = m.bedtime.trim();
      return entry;
    });
  const summary = list
    .map((m) => {
      const schedule = (["เช้า", "เที่ยง", "เย็น", "ก่อนนอน"] as const)
        .filter((k) => m[k])
        .map((k) => `${k} ${m[k]}`)
        .join(", ");
      return schedule ? `${m["ชื่อยา"]} (${schedule})` : m["ชื่อยา"];
    })
    .filter(Boolean)
    .join("; ");
  return {
    medicationData: { เรือนนอน: dormitory ?? "", รายการยา: list } as Prisma.InputJsonObject,
    regularMedication: summary || null,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const classRoom = String(req.query.classRoom ?? "").trim();
    const dormitory = String(req.query.dormitory ?? "").trim();
    const includeInactive = req.query.includeInactive === "true";
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(5, Number(req.query.pageSize ?? 20)));

    const where: Prisma.StudentWhereInput = {
      NOT: { studentCode: { contains: "-MED-" } },
    };
    if (!includeInactive) where.isActive = true;
    if (classRoom) where.classRoom = classRoom;
    if (dormitory) where.dormitory = dormitory;
    if (q) {
      where.OR = [
        { studentCode: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        orderBy: [{ classRoom: "asc" }, { firstName: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({ data, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) return res.json({ data: [] });
    const data = await prisma.student.findMany({
      where: {
        isActive: true,
        NOT: { studentCode: { contains: "-MED-" } },
        OR: [
          { studentCode: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: [{ firstName: "asc" }],
      take: 15,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/distinct/classrooms", async (_req, res, next) => {
  try {
    const rows = await prisma.student.findMany({
      where: { isActive: true, classRoom: { not: null } },
      select: { classRoom: true },
      distinct: ["classRoom"],
      orderBy: { classRoom: "asc" },
    });
    res.json({ data: rows.map((r) => r.classRoom).filter(Boolean) });
  } catch (err) {
    next(err);
  }
});

router.get("/distinct/dormitories", async (_req, res, next) => {
  try {
    const rows = await prisma.student.findMany({
      where: { isActive: true, dormitory: { not: null } },
      select: { dormitory: true },
      distinct: ["dormitory"],
      orderBy: { dormitory: "asc" },
    });
    res.json({ data: rows.map((r) => r.dormitory).filter(Boolean) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        opdVisits: {
          orderBy: { visitDate: "desc" },
          take: 50,
          include: { recordedBy: { select: { id: true, fullName: true } } },
        },
        admissions: {
          orderBy: { admitDate: "desc" },
          take: 30,
          include: { recordedBy: { select: { id: true, fullName: true } } },
        },
        referrals: {
          orderBy: { referralDate: "desc" },
          take: 30,
          include: { recordedBy: { select: { id: true, fullName: true } } },
        },
      },
    });
    if (!student) throw new HttpError(404, "ไม่พบข้อมูลนักเรียน");
    res.json({ student });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const body = studentSchema.parse(req.body);
    const meds = buildMedicationFields(body.medications, body.dormitory);
    const guardians = guardianFields(body.guardians);
    const healthData = mergeHealthExtra(body.healthExtra, {});
    const student = await prisma.student.create({
      data: {
        studentCode: body.studentCode,
        firstName: body.firstName,
        lastName: body.lastName,
        nickname: body.nickname || null,
        classRoom: body.classRoom || null,
        dormitory: body.dormitory || null,
        homeroomTeacher: body.homeroomTeacher || null,
        homeroomTeacherPhone: body.homeroomTeacherPhone || null,
        bloodType: body.bloodType ?? "unknown",
        congenitalDisease: body.congenitalDisease || null,
        drugAllergy: body.drugAllergy || null,
        regularMedication: meds ? meds.regularMedication : body.regularMedication || null,
        parentName: guardians ? guardians.parentName : body.parentName || null,
        parentPhone: guardians ? guardians.parentPhone : body.parentPhone || null,
        studentStatus: body.studentStatus ?? "resident",
        ...(guardians ? { guardians: guardians.guardians } : {}),
        ...(healthData ? { healthData } : {}),
        ...(meds ? { medicationData: meds.medicationData } : {}),
      },
    });
    res.status(201).json({ student });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const body = studentSchema.partial().parse(req.body);
    const { medications, guardians: guardiansBody, healthExtra, ...rest } = body;
    const meds = buildMedicationFields(medications, body.dormitory);
    const guardians = guardianFields(guardiansBody);
    const existing = healthExtra
      ? await prisma.student.findUnique({
          where: { id: req.params.id },
          select: { healthData: true },
        })
      : null;
    const healthData = mergeHealthExtra(healthExtra, existing?.healthData);
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        nickname: body.nickname === "" ? null : body.nickname,
        classRoom: body.classRoom === "" ? null : body.classRoom,
        dormitory: body.dormitory === "" ? null : body.dormitory,
        homeroomTeacher:
          body.homeroomTeacher === "" ? null : body.homeroomTeacher,
        homeroomTeacherPhone:
          body.homeroomTeacherPhone === "" ? null : body.homeroomTeacherPhone,
        congenitalDisease:
          body.congenitalDisease === "" ? null : body.congenitalDisease,
        drugAllergy: body.drugAllergy === "" ? null : body.drugAllergy,
        regularMedication: meds
          ? meds.regularMedication
          : body.regularMedication === ""
            ? null
            : body.regularMedication,
        parentName: guardians
          ? guardians.parentName
          : body.parentName === ""
            ? null
            : body.parentName,
        parentPhone: guardians
          ? guardians.parentPhone
          : body.parentPhone === ""
            ? null
            : body.parentPhone,
        ...(guardians ? { guardians: guardians.guardians } : {}),
        ...(healthData ? { healthData } : {}),
        ...(meds ? { medicationData: meds.medicationData } : {}),
      },
    });
    res.json({ student });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await prisma.$transaction([
      prisma.opdVisit.deleteMany({ where: { studentId: req.params.id } }),
      prisma.admission.deleteMany({ where: { studentId: req.params.id } }),
      prisma.referral.deleteMany({ where: { studentId: req.params.id } }),
      prisma.student.delete({ where: { id: req.params.id } }),
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const importItemSchema = studentSchema.omit({ isActive: true });
const importSchema = z.object({
  items: z.array(importItemSchema).min(1, "ไม่มีรายการให้นำเข้า"),
});

router.post("/import", requireAdmin, async (req, res, next) => {
  try {
    const { items } = importSchema.parse(req.body);
    let created = 0;
    let updated = 0;
    const errors: { studentCode: string; message: string }[] = [];
    for (const item of items) {
      try {
        const existing = await prisma.student.findUnique({
          where: { studentCode: item.studentCode },
        });
        if (existing) {
          await prisma.student.update({
            where: { studentCode: item.studentCode },
            data: {
              firstName: item.firstName,
              lastName: item.lastName,
              classRoom: item.classRoom || null,
              dormitory: item.dormitory || null,
              homeroomTeacher: item.homeroomTeacher || null,
              bloodType: item.bloodType ?? existing.bloodType,
              congenitalDisease: item.congenitalDisease || null,
              drugAllergy: item.drugAllergy || null,
              regularMedication: item.regularMedication || null,
              parentName: item.parentName || null,
              parentPhone: item.parentPhone || null,
              studentStatus: item.studentStatus ?? existing.studentStatus,
            },
          });
          updated++;
        } else {
          await prisma.student.create({
            data: {
              studentCode: item.studentCode,
              firstName: item.firstName,
              lastName: item.lastName,
              classRoom: item.classRoom || null,
              dormitory: item.dormitory || null,
              homeroomTeacher: item.homeroomTeacher || null,
              bloodType: item.bloodType ?? "unknown",
              congenitalDisease: item.congenitalDisease || null,
              drugAllergy: item.drugAllergy || null,
              regularMedication: item.regularMedication || null,
              parentName: item.parentName || null,
              parentPhone: item.parentPhone || null,
              studentStatus: item.studentStatus ?? "resident",
            },
          });
          created++;
        }
      } catch (e) {
        errors.push({
          studentCode: item.studentCode,
          message:
            e instanceof Error ? e.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
        });
      }
    }
    res.json({ created, updated, errors });
  } catch (err) {
    next(err);
  }
});

export default router;
