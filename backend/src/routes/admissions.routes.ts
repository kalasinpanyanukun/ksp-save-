import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { HttpError } from "../middleware/error.middleware.js";
import { diffDaysInclusive } from "../utils/date.js";

const router = Router();
router.use(authMiddleware);

const destEnum = z.enum(["dormitory", "home", "hospital", "other"]);

const admissionSchema = z.object({
  studentId: z.string().uuid(),
  admitDate: z.string().min(1),
  admitTime: z.string().regex(/^\d{2}:\d{2}$/),
  chiefComplaint: z.string().trim().min(1, "กรุณาระบุอาการ"),
  dischargeDate: z.string().nullable().optional(),
  dischargeTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  dischargeDestination: destEnum.nullable().optional(),
  notes: z.string().trim().optional().nullable(),
});

const dischargeSchema = z.object({
  dischargeDate: z.string().min(1),
  dischargeTime: z.string().regex(/^\d{2}:\d{2}$/),
  dischargeDestination: destEnum,
  notes: z.string().trim().optional().nullable(),
});

const studentInclude = {
  select: {
    id: true,
    studentCode: true,
    firstName: true,
    lastName: true,
    nickname: true,
    classRoom: true,
    dormitory: true,
  },
};

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(5, Number(req.query.pageSize ?? 20)));
    const studentId = String(req.query.studentId ?? "").trim();
    const status = String(req.query.status ?? "").trim();
    const where: Prisma.AdmissionWhereInput = {};
    if (studentId) where.studentId = studentId;
    if (status === "active") where.dischargeDate = null;
    if (status === "discharged") where.dischargeDate = { not: null };

    const [total, data] = await Promise.all([
      prisma.admission.count({ where }),
      prisma.admission.findMany({
        where,
        orderBy: [{ admitDate: "desc" }, { admitTime: "desc" }],
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

router.get("/active", async (_req, res, next) => {
  try {
    const data = await prisma.admission.findMany({
      where: { dischargeDate: null },
      orderBy: { admitDate: "asc" },
      include: {
        student: studentInclude,
        recordedBy: { select: { id: true, fullName: true } },
      },
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const admission = await prisma.admission.findUnique({
      where: { id: req.params.id },
      include: {
        student: studentInclude,
        recordedBy: { select: { id: true, fullName: true } },
      },
    });
    if (!admission) throw new HttpError(404, "ไม่พบบันทึก");
    res.json({ admission });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = admissionSchema.parse(req.body);
    const admitDate = new Date(body.admitDate);
    const dischargeDate = body.dischargeDate ? new Date(body.dischargeDate) : null;
    const totalDays = dischargeDate
      ? diffDaysInclusive(admitDate, dischargeDate)
      : null;

    const admission = await prisma.admission.create({
      data: {
        studentId: body.studentId,
        admitDate,
        admitTime: body.admitTime,
        chiefComplaint: body.chiefComplaint,
        dischargeDate,
        dischargeTime: body.dischargeTime ?? null,
        dischargeDestination: body.dischargeDestination ?? null,
        totalDays,
        notes: body.notes ?? null,
        recordedById: req.user!.sub,
      },
      include: {
        student: studentInclude,
        recordedBy: { select: { id: true, fullName: true } },
      },
    });
    res.status(201).json({ admission });
  } catch (err) {
    next(err);
  }
});

router.put("/:id/discharge", async (req, res, next) => {
  try {
    const body = dischargeSchema.parse(req.body);
    const existing = await prisma.admission.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) throw new HttpError(404, "ไม่พบบันทึก admission");
    const dischargeDate = new Date(body.dischargeDate);
    const totalDays = diffDaysInclusive(existing.admitDate, dischargeDate);
    const admission = await prisma.admission.update({
      where: { id: req.params.id },
      data: {
        dischargeDate,
        dischargeTime: body.dischargeTime,
        dischargeDestination: body.dischargeDestination,
        notes: body.notes ?? existing.notes,
        totalDays,
      },
      include: {
        student: studentInclude,
        recordedBy: { select: { id: true, fullName: true } },
      },
    });
    res.json({ admission });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const body = admissionSchema.partial().parse(req.body);
    const existing = await prisma.admission.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) throw new HttpError(404, "ไม่พบบันทึก");
    const admitDate = body.admitDate ? new Date(body.admitDate) : existing.admitDate;
    const dischargeDate =
      body.dischargeDate === null
        ? null
        : body.dischargeDate
          ? new Date(body.dischargeDate)
          : existing.dischargeDate;
    const totalDays = dischargeDate ? diffDaysInclusive(admitDate, dischargeDate) : null;
    const admission = await prisma.admission.update({
      where: { id: req.params.id },
      data: {
        ...body,
        admitDate,
        dischargeDate,
        totalDays,
      },
      include: {
        student: studentInclude,
        recordedBy: { select: { id: true, fullName: true } },
      },
    });
    res.json({ admission });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.admission.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
