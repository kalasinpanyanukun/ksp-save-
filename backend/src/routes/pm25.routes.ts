import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

const aqiEnum = z.enum([
  "good",
  "moderate",
  "unhealthy_sensitive",
  "unhealthy",
  "very_unhealthy",
  "hazardous",
]);

const pm25PointSchema = z.object({
  id: z.string().trim().optional(),
  location: z.string().trim().min(1, "กรุณาระบุชื่อสถานที่").max(120),
  pm25Value: z.number().nonnegative(),
});

const pm25Schema = z.object({
  recordDate: z.string().min(1),
  recordTime: z.string().regex(/^\d{2}:\d{2}$/),
  pm25Value: z.number().nonnegative().optional(),
  measurementPoints: z.array(pm25PointSchema).min(1).max(30).optional(),
  aqiLevel: aqiEnum.optional(),
  notes: z.string().trim().optional().nullable(),
}).superRefine((body, ctx) => {
  if (!body.measurementPoints?.length && body.pm25Value == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["measurementPoints"],
      message: "กรุณาระบุอย่างน้อย 1 จุดวัด",
    });
  }
});

type Pm25Body = z.infer<typeof pm25Schema>;
type Pm25Point = z.infer<typeof pm25PointSchema>;

function aqiFromValue(value: number): z.infer<typeof aqiEnum> {
  if (value <= 12) return "good";
  if (value <= 35.4) return "moderate";
  if (value <= 55.4) return "unhealthy_sensitive";
  if (value <= 150.4) return "unhealthy";
  if (value <= 250.4) return "very_unhealthy";
  return "hazardous";
}

function normalizePoints(body: Pm25Body): Pm25Point[] {
  const points = body.measurementPoints?.length
    ? body.measurementPoints
    : [{ location: "จุดวัดหลัก", pm25Value: body.pm25Value ?? 0 }];

  return points.map((point, index) => ({
    id: point.id?.trim() || `${Date.now()}-${index + 1}`,
    location: point.location.trim(),
    pm25Value: Number(point.pm25Value.toFixed(2)),
  }));
}

function averagePoints(points: Pm25Point[]): number {
  if (points.length === 0) return 0;
  const average =
    points.reduce((sum, point) => sum + point.pm25Value, 0) / points.length;
  return Number(average.toFixed(2));
}

function monthRange(month: string) {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  return { start, end };
}

function dateRange(from: string, to: string) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(from) || !datePattern.test(to)) return null;
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (end <= start) return null;
  return { start, end };
}

router.get("/", async (req, res, next) => {
  try {
    const from = typeof req.query.from === "string" ? req.query.from : "";
    const to = typeof req.query.to === "string" ? req.query.to : "";
    const explicitRange = from && to ? dateRange(from, to) : null;
    const month = typeof req.query.month === "string" ? req.query.month : "";
    const monthOnlyRange = month ? monthRange(month) : null;
    const range = explicitRange ?? monthOnlyRange;
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 30)));
    const start = range?.start ?? new Date();
    if (!range) start.setDate(start.getDate() - days);
    const data = await prisma.pm25Record.findMany({
      where: range
        ? { recordDate: { gte: range.start, lt: range.end } }
        : { recordDate: { gte: start } },
      orderBy: [{ recordDate: "desc" }, { recordTime: "desc" }],
      include: { recordedBy: { select: { id: true, fullName: true } } },
    });
    res.json({
      days: range ? undefined : days,
      from: explicitRange ? from : undefined,
      to: explicitRange ? to : undefined,
      month: monthOnlyRange && !explicitRange ? month : undefined,
      data,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/latest", async (_req, res, next) => {
  try {
    const latest = await prisma.pm25Record.findFirst({
      orderBy: [{ recordDate: "desc" }, { recordTime: "desc" }],
      include: { recordedBy: { select: { fullName: true } } },
    });
    res.json({ record: latest });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const record = await prisma.pm25Record.findUnique({
      where: { id: req.params.id },
      include: { recordedBy: { select: { id: true, fullName: true } } },
    });
    if (!record) return res.status(404).json({ message: "ไม่พบบันทึก PM2.5" });
    res.json({ record });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = pm25Schema.parse(req.body);
    const points = normalizePoints(body);
    const average = averagePoints(points);
    const aqi = body.aqiLevel ?? aqiFromValue(average);
    const record = await prisma.pm25Record.create({
      data: {
        recordDate: new Date(body.recordDate),
        recordTime: body.recordTime,
        pm25Value: new Prisma.Decimal(average),
        measurementPoints: points as Prisma.InputJsonValue,
        aqiLevel: aqi,
        notes: body.notes ?? null,
        recordedById: req.user!.sub,
      },
      include: { recordedBy: { select: { fullName: true } } },
    });
    res.status(201).json({ record });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const body = pm25Schema.parse(req.body);
    const points = normalizePoints(body);
    const average = averagePoints(points);
    const aqi = body.aqiLevel ?? aqiFromValue(average);
    const record = await prisma.pm25Record.update({
      where: { id: req.params.id },
      data: {
        recordDate: new Date(body.recordDate),
        recordTime: body.recordTime,
        pm25Value: new Prisma.Decimal(average),
        measurementPoints: points as Prisma.InputJsonValue,
        aqiLevel: aqi,
        notes: body.notes ?? null,
      },
      include: { recordedBy: { select: { fullName: true } } },
    });
    res.json({ record });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.pm25Record.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
