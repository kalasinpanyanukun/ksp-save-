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

const pm25Schema = z.object({
  recordDate: z.string().min(1),
  recordTime: z.string().regex(/^\d{2}:\d{2}$/),
  pm25Value: z.number().nonnegative(),
  aqiLevel: aqiEnum.optional(),
  notes: z.string().trim().optional().nullable(),
});

function aqiFromValue(value: number): z.infer<typeof aqiEnum> {
  if (value <= 12) return "good";
  if (value <= 35.4) return "moderate";
  if (value <= 55.4) return "unhealthy_sensitive";
  if (value <= 150.4) return "unhealthy";
  if (value <= 250.4) return "very_unhealthy";
  return "hazardous";
}

router.get("/", async (req, res, next) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 30)));
    const start = new Date();
    start.setDate(start.getDate() - days);
    const data = await prisma.pm25Record.findMany({
      where: { recordDate: { gte: start } },
      orderBy: [{ recordDate: "desc" }, { recordTime: "desc" }],
      include: { recordedBy: { select: { id: true, fullName: true } } },
    });
    res.json({ days, data });
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

router.post("/", async (req, res, next) => {
  try {
    const body = pm25Schema.parse(req.body);
    const aqi = body.aqiLevel ?? aqiFromValue(body.pm25Value);
    const record = await prisma.pm25Record.create({
      data: {
        recordDate: new Date(body.recordDate),
        recordTime: body.recordTime,
        pm25Value: new Prisma.Decimal(body.pm25Value),
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
    const aqi = body.aqiLevel ?? aqiFromValue(body.pm25Value);
    const record = await prisma.pm25Record.update({
      where: { id: req.params.id },
      data: {
        recordDate: new Date(body.recordDate),
        recordTime: body.recordTime,
        pm25Value: new Prisma.Decimal(body.pm25Value),
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
