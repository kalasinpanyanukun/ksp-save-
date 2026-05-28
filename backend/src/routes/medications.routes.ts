import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/rbac.middleware.js";
import { HttpError } from "../middleware/error.middleware.js";

const router = Router();
router.use(authMiddleware);

const medicationSchema = z.object({
  drugCode: z.string().trim().min(1).max(20),
  drugName: z.string().trim().min(1).max(200),
  drugType: z.string().trim().max(50).optional().nullable(),
  unit: z.string().trim().max(20).optional().nullable(),
  stockQty: z.number().int().nonnegative().default(0),
  minStock: z.number().int().nonnegative().default(0),
  isActive: z.boolean().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const lowStock = req.query.lowStock === "true";
    const where: Prisma.MedicationWhereInput = { isActive: true };
    if (q) {
      where.OR = [
        { drugCode: { contains: q, mode: "insensitive" } },
        { drugName: { contains: q, mode: "insensitive" } },
      ];
    }
    const items = await prisma.medication.findMany({
      where,
      orderBy: { drugName: "asc" },
    });
    const result = lowStock
      ? items.filter((m) => m.stockQty <= m.minStock)
      : items;
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) return res.json({ data: [] });
    const items = await prisma.medication.findMany({
      where: {
        isActive: true,
        OR: [
          { drugCode: { contains: q, mode: "insensitive" } },
          { drugName: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { drugName: "asc" },
      take: 15,
    });
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const body = medicationSchema.parse(req.body);
    const data: Prisma.MedicationCreateInput = {
      drugCode: body.drugCode,
      drugName: body.drugName,
      drugType: body.drugType,
      unit: body.unit,
      stockQty: body.stockQty,
      minStock: body.minStock,
      isActive: body.isActive,
    };
    const med = await prisma.medication.create({ data });
    res.status(201).json({ medication: med });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const body = medicationSchema.partial().parse(req.body);
    const med = await prisma.medication.update({
      where: { id: req.params.id },
      data: body,
    });
    res.json({ medication: med });
  } catch (err) {
    next(err);
  }
});

const adjustSchema = z.object({
  delta: z.number().int(),
  reason: z.string().trim().optional(),
});

router.post("/:id/adjust", async (req, res, next) => {
  try {
    const { delta } = adjustSchema.parse(req.body);
    const existing = await prisma.medication.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) throw new HttpError(404, "ไม่พบยานี้");
    const newQty = existing.stockQty + delta;
    if (newQty < 0) throw new HttpError(400, "จำนวนยาคงเหลือไม่พอ");
    const med = await prisma.medication.update({
      where: { id: req.params.id },
      data: { stockQty: newQty },
    });
    res.json({ medication: med });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await prisma.medication.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
