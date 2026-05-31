import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

const handoffTypes = ["check_in", "check_out"] as const;

const handoffSchema = z.object({
  studentId: z.string().uuid(),
  handoffType: z.enum(handoffTypes),
  handoffDate: z.string().min(1),
  handoffTime: z.string().regex(/^\d{2}:\d{2}$/),
  companionName: z.string().trim().min(1, "กรุณาระบุผู้พามาส่ง/รับกลับ").max(120),
  companionPhone: z.string().trim().max(30).optional().nullable(),
  nurseName: z.string().trim().max(120).optional().nullable(),
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
    studentStatus: true,
  },
};

function dateOnly(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    23,
    59,
    59,
    999,
  );
}

function parseDateQuery(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : dateOnly(d);
}

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

function yearRange(year: number) {
  return {
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
  };
}

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(5, Number(req.query.pageSize ?? 20)));
    const type = z.enum(handoffTypes).optional().safeParse(req.query.type);
    const studentId = String(req.query.studentId ?? "").trim();
    const q = String(req.query.q ?? "").trim();
    const from = parseDateQuery(req.query.from);
    const to = parseDateQuery(req.query.to);

    const where: Prisma.StudentHandoffWhereInput = {};
    if (type.success && type.data) where.handoffType = type.data;
    if (studentId) where.studentId = studentId;
    if (from || to) {
      where.handoffDate = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: endOfDay(to) } : {}),
      };
    }
    if (q) {
      where.OR = [
        { companionName: { contains: q, mode: "insensitive" } },
        { nurseName: { contains: q, mode: "insensitive" } },
        {
          student: {
            OR: [
              { studentCode: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.studentHandoff.count({ where }),
      prisma.studentHandoff.findMany({
        where,
        orderBy: [{ handoffDate: "desc" }, { handoffTime: "desc" }],
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

router.get("/summary", async (req, res, next) => {
  try {
    const now = new Date();
    const year = Math.max(2000, Number(req.query.year ?? now.getFullYear()));
    const month = Math.min(12, Math.max(1, Number(req.query.month ?? now.getMonth() + 1)));
    const todayStart = dateOnly(now);
    const todayEnd = endOfDay(todayStart);
    const monthDates = monthRange(year, month);
    const yearDates = yearRange(year);

    const [todayRows, monthRows, yearRows] = await Promise.all([
      prisma.studentHandoff.findMany({
        where: { handoffDate: { gte: todayStart, lte: todayEnd } },
        select: { handoffType: true },
      }),
      prisma.studentHandoff.findMany({
        where: { handoffDate: { gte: monthDates.start, lte: monthDates.end } },
        select: { handoffType: true, handoffDate: true },
      }),
      prisma.studentHandoff.findMany({
        where: { handoffDate: { gte: yearDates.start, lte: yearDates.end } },
        select: { handoffType: true, handoffDate: true },
      }),
    ]);

    const countType = (rows: { handoffType: (typeof handoffTypes)[number] }[], handoffType: (typeof handoffTypes)[number]) =>
      rows.filter((row) => row.handoffType === handoffType).length;

    const daysInMonth = new Date(year, month, 0).getDate();
    const byDay = Array.from({ length: daysInMonth }, (_, index) => ({
      day: index + 1,
      checkIn: 0,
      checkOut: 0,
    }));
    for (const row of monthRows) {
      const target = byDay[row.handoffDate.getDate() - 1];
      if (!target) continue;
      if (row.handoffType === "check_in") target.checkIn += 1;
      if (row.handoffType === "check_out") target.checkOut += 1;
    }

    const byMonth = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      checkIn: 0,
      checkOut: 0,
    }));
    for (const row of yearRows) {
      const target = byMonth[row.handoffDate.getMonth()];
      if (!target) continue;
      if (row.handoffType === "check_in") target.checkIn += 1;
      if (row.handoffType === "check_out") target.checkOut += 1;
    }

    res.json({
      today: {
        checkIn: countType(todayRows, "check_in"),
        checkOut: countType(todayRows, "check_out"),
      },
      month: {
        checkIn: countType(monthRows, "check_in"),
        checkOut: countType(monthRows, "check_out"),
      },
      year: {
        checkIn: countType(yearRows, "check_in"),
        checkOut: countType(yearRows, "check_out"),
      },
      byDay,
      byMonth,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = handoffSchema.parse(req.body);
    const nextStatus = body.handoffType === "check_in" ? "resident" : "home_leave";
    const handoff = await prisma.$transaction(async (tx) => {
      const created = await tx.studentHandoff.create({
        data: {
          studentId: body.studentId,
          handoffType: body.handoffType,
          handoffDate: new Date(body.handoffDate),
          handoffTime: body.handoffTime,
          companionName: body.companionName,
          companionPhone: body.companionPhone || null,
          nurseName: body.nurseName || req.user!.fullName,
          notes: body.notes || null,
          recordedById: req.user!.sub,
        },
        include: {
          student: studentInclude,
          recordedBy: { select: { id: true, fullName: true } },
        },
      });
      await tx.student.update({
        where: { id: body.studentId },
        data: { studentStatus: nextStatus },
      });
      return created;
    });

    res.status(201).json({ handoff });
  } catch (err) {
    next(err);
  }
});

export default router;
