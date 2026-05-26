import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { HttpError } from "../middleware/error.middleware.js";

const router = Router();
router.use(authMiddleware);

const medItemSchema = z.object({
  drugId: z.string().optional(),
  drugName: z.string().min(1),
  dose: z.string().optional(),
  qty: z.number().int().nonnegative().optional(),
});

const visitSchema = z.object({
  studentId: z.string().uuid("studentId ไม่ถูกต้อง"),
  visitDate: z.string().min(1),
  visitTime: z.string().regex(/^\d{2}:\d{2}$/),
  chiefComplaint: z.string().trim().min(1, "กรุณาระบุอาการ"),
  diagnosis: z.string().trim().optional().nullable(),
  treatment: z.string().trim().optional().nullable(),
  medications: z.array(medItemSchema).default([]),
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
    const date = String(req.query.date ?? "").trim();
    const studentId = String(req.query.studentId ?? "").trim();
    const where: Prisma.OpdVisitWhereInput = {};
    if (date) where.visitDate = new Date(date);
    if (studentId) where.studentId = studentId;

    const [total, data] = await Promise.all([
      prisma.opdVisit.count({ where }),
      prisma.opdVisit.findMany({
        where,
        orderBy: [{ visitDate: "desc" }, { visitTime: "desc" }],
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

router.get("/student/:studentId", async (req, res, next) => {
  try {
    const data = await prisma.opdVisit.findMany({
      where: { studentId: req.params.studentId },
      orderBy: [{ visitDate: "desc" }, { visitTime: "desc" }],
      include: {
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
    const visit = await prisma.opdVisit.findUnique({
      where: { id: req.params.id },
      include: {
        student: studentInclude,
        recordedBy: { select: { id: true, fullName: true } },
      },
    });
    if (!visit) throw new HttpError(404, "ไม่พบบันทึก OPD");
    res.json({ visit });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = visitSchema.parse(req.body);
    const visit = await prisma.opdVisit.create({
      data: {
        studentId: body.studentId,
        visitDate: new Date(body.visitDate),
        visitTime: body.visitTime,
        chiefComplaint: body.chiefComplaint,
        diagnosis: body.diagnosis || null,
        treatment: body.treatment || null,
        medications: body.medications as unknown as Prisma.InputJsonValue,
        notes: body.notes || null,
        recordedById: req.user!.sub,
      },
      include: {
        student: studentInclude,
        recordedBy: { select: { id: true, fullName: true } },
      },
    });

    // ลด stock ยาให้สอดคล้อง
    for (const med of body.medications) {
      if (med.drugId && med.qty && med.qty > 0) {
        await prisma.medication.update({
          where: { id: med.drugId },
          data: { stockQty: { decrement: med.qty } },
        }).catch(() => undefined);
      }
    }

    res.status(201).json({ visit });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const body = visitSchema.partial().parse(req.body);
    const visit = await prisma.opdVisit.update({
      where: { id: req.params.id },
      data: {
        ...body,
        visitDate: body.visitDate ? new Date(body.visitDate) : undefined,
        medications: body.medications
          ? (body.medications as unknown as Prisma.InputJsonValue)
          : undefined,
      },
      include: {
        student: studentInclude,
        recordedBy: { select: { id: true, fullName: true } },
      },
    });
    res.json({ visit });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.opdVisit.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
