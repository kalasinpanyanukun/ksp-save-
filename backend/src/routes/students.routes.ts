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

const studentSchema = z.object({
  studentCode: z.string().trim().min(1, "กรุณากรอกรหัสนักเรียน").max(20),
  firstName: z.string().trim().min(1, "กรุณากรอกชื่อ").max(100),
  lastName: z.string().trim().min(1, "กรุณากรอกนามสกุล").max(100),
  classRoom: z.string().trim().max(20).optional().nullable(),
  dormitory: z.string().trim().max(50).optional().nullable(),
  homeroomTeacher: z.string().trim().max(100).optional().nullable(),
  bloodType: z.enum(bloodTypes).optional(),
  congenitalDisease: z.string().trim().max(2000).optional().nullable(),
  drugAllergy: z.string().trim().max(2000).optional().nullable(),
  regularMedication: z.string().trim().max(2000).optional().nullable(),
  parentName: z.string().trim().max(100).optional().nullable(),
  parentPhone: z.string().trim().max(20).optional().nullable(),
  isActive: z.boolean().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const classRoom = String(req.query.classRoom ?? "").trim();
    const dormitory = String(req.query.dormitory ?? "").trim();
    const includeInactive = req.query.includeInactive === "true";
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(5, Number(req.query.pageSize ?? 20)));

    const where: Prisma.StudentWhereInput = {};
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
    const student = await prisma.student.create({
      data: {
        studentCode: body.studentCode,
        firstName: body.firstName,
        lastName: body.lastName,
        classRoom: body.classRoom || null,
        dormitory: body.dormitory || null,
        homeroomTeacher: body.homeroomTeacher || null,
        bloodType: body.bloodType ?? "unknown",
        congenitalDisease: body.congenitalDisease || null,
        drugAllergy: body.drugAllergy || null,
        regularMedication: body.regularMedication || null,
        parentName: body.parentName || null,
        parentPhone: body.parentPhone || null,
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
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: {
        ...body,
        classRoom: body.classRoom === "" ? null : body.classRoom,
        dormitory: body.dormitory === "" ? null : body.dormitory,
        homeroomTeacher:
          body.homeroomTeacher === "" ? null : body.homeroomTeacher,
        congenitalDisease:
          body.congenitalDisease === "" ? null : body.congenitalDisease,
        drugAllergy: body.drugAllergy === "" ? null : body.drugAllergy,
        regularMedication:
          body.regularMedication === "" ? null : body.regularMedication,
        parentName: body.parentName === "" ? null : body.parentName,
        parentPhone: body.parentPhone === "" ? null : body.parentPhone,
      },
    });
    res.json({ student });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await prisma.student.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
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
