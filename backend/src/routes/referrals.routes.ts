import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { HttpError } from "../middleware/error.middleware.js";

const router = Router();
router.use(authMiddleware);

const referralSchema = z.object({
  studentId: z.string().uuid(),
  referralDate: z.string().min(1),
  referralTime: z.string().regex(/^\d{2}:\d{2}$/),
  chiefComplaint: z.string().trim().min(1),
  referredTo: z.string().trim().min(1, "กรุณาระบุโรงพยาบาลปลายทาง"),
  treatmentGiven: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

const studentInclude = {
  select: {
    id: true,
    studentCode: true,
    firstName: true,
    lastName: true,
    classRoom: true,
    dormitory: true,
  },
};

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(5, Number(req.query.pageSize ?? 20)));
    const studentId = String(req.query.studentId ?? "").trim();
    const where: Prisma.ReferralWhereInput = {};
    if (studentId) where.studentId = studentId;

    const [total, data] = await Promise.all([
      prisma.referral.count({ where }),
      prisma.referral.findMany({
        where,
        orderBy: [{ referralDate: "desc" }, { referralTime: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          student: studentInclude,
          recordedBy: { select: { id: true, fullName: true } },
        },
      }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

router.get("/summary", async (_req, res, next) => {
  try {
    const start = new Date();
    start.setMonth(start.getMonth() - 11);
    start.setDate(1);
    const rows = await prisma.referral.findMany({
      where: { referralDate: { gte: start } },
      select: { referralDate: true, referredTo: true },
    });
    const byHospital: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    for (const r of rows) {
      byHospital[r.referredTo] = (byHospital[r.referredTo] ?? 0) + 1;
      const key = `${r.referralDate.getFullYear()}-${String(r.referralDate.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] ?? 0) + 1;
    }
    res.json({
      total: rows.length,
      byHospital: Object.entries(byHospital)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      byMonth: Object.entries(byMonth)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const referral = await prisma.referral.findUnique({
      where: { id: req.params.id },
      include: {
        student: studentInclude,
        recordedBy: { select: { id: true, fullName: true } },
      },
    });
    if (!referral) throw new HttpError(404, "ไม่พบบันทึกการส่งต่อ");
    res.json({ referral });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = referralSchema.parse(req.body);
    const referral = await prisma.referral.create({
      data: {
        studentId: body.studentId,
        referralDate: new Date(body.referralDate),
        referralTime: body.referralTime,
        chiefComplaint: body.chiefComplaint,
        referredTo: body.referredTo,
        treatmentGiven: body.treatmentGiven ?? null,
        notes: body.notes ?? null,
        recordedById: req.user!.sub,
      },
      include: {
        student: studentInclude,
        recordedBy: { select: { id: true, fullName: true } },
      },
    });
    res.status(201).json({ referral });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const body = referralSchema.partial().parse(req.body);
    const referral = await prisma.referral.update({
      where: { id: req.params.id },
      data: {
        ...body,
        referralDate: body.referralDate ? new Date(body.referralDate) : undefined,
      },
      include: {
        student: studentInclude,
        recordedBy: { select: { id: true, fullName: true } },
      },
    });
    res.json({ referral });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.referral.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
