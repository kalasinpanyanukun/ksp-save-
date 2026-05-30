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
  source: z.string().trim().max(40).optional(),
  category: z.enum(["medicine", "supply"]).optional(),
  unit: z.string().trim().max(20).optional().nullable(),
  stockQty: z.number().int().nonnegative().default(0),
  minStock: z.number().int().nonnegative().default(0),
  entryStatus: z.enum(["entered", "not_entered"]).optional(),
  isActive: z.boolean().optional(),
});

function jsonRecord(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function displayText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function hashDrugName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return `STU${hash.toString(36).toUpperCase().slice(0, 9)}`.slice(0, 20);
}

function normalizeDrugName(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

function splitMedicationSummary(summary: string | null) {
  if (!summary) return [];
  return summary
    .split(/[;,\n]/)
    .map(normalizeDrugName)
    .filter((name) => name.length >= 2 && name !== "-");
}

function extractStudentMedicationNames(student: {
  regularMedication: string | null;
  medicationData: Prisma.JsonValue;
}) {
  const names = new Set<string>();
  const data = jsonRecord(student.medicationData);
  const medications = Array.isArray(data["รายการยา"])
    ? (data["รายการยา"] as Record<string, unknown>[])
    : [];

  for (const medication of medications) {
    const name =
      displayText(medication["ข้อมูลยา ชื่อยา"]) ||
      displayText(medication["ชื่อยา"]);
    const strength =
      displayText(medication["ข้อมูลยา ขนาดยา"]) ||
      displayText(medication["ขนาดยา"]);
    const normalized = normalizeDrugName([name, strength].filter(Boolean).join(" "));
    if (normalized) names.add(normalized);
  }

  for (const name of splitMedicationSummary(student.regularMedication)) {
    names.add(name);
  }

  return [...names];
}

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
      ? items.filter((m) => m.entryStatus === "entered" && m.stockQty <= m.minStock)
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
      source: body.source ?? "เรือนพยาบาล",
      category: body.category ?? "medicine",
      unit: body.unit,
      stockQty: body.stockQty,
      minStock: body.minStock,
      entryStatus: body.entryStatus ?? "entered",
      isActive: body.isActive,
    };
    const med = await prisma.medication.create({ data });
    res.status(201).json({ medication: med });
  } catch (err) {
    next(err);
  }
});

router.post("/import-from-students", requireAdmin, async (_req, res, next) => {
  try {
    const students = await prisma.student.findMany({
      where: {
        isActive: true,
        NOT: { studentCode: { contains: "-MED-" } },
      },
      select: {
        regularMedication: true,
        medicationData: true,
      },
    });
    const existing = await prisma.medication.findMany({
      select: { drugName: true, drugCode: true },
    });
    const existingNames = new Set(
      existing.map((item) => item.drugName.trim().toLowerCase()),
    );
    const existingCodes = new Set(existing.map((item) => item.drugCode));
    const names = new Set<string>();

    for (const student of students) {
      for (const name of extractStudentMedicationNames(student)) {
        names.add(name);
      }
    }

    let created = 0;
    let skipped = 0;
    for (const name of names) {
      if (existingNames.has(name.toLowerCase())) {
        skipped++;
        continue;
      }

      let drugCode = hashDrugName(name);
      let suffix = 1;
      while (existingCodes.has(drugCode)) {
        drugCode = `${hashDrugName(name).slice(0, 17)}${suffix}`;
        suffix++;
      }
      existingCodes.add(drugCode);
      existingNames.add(name.toLowerCase());

      await prisma.medication.create({
        data: {
          drugCode,
          drugName: name,
          drugType: "ยาประจำตัวนักเรียน",
          unit: null,
          stockQty: 0,
          minStock: 0,
          entryStatus: "not_entered",
        },
      });
      created++;
    }

    res.json({ created, skipped });
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
    const { delta, reason } = adjustSchema.parse(req.body);
    const existing = await prisma.medication.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) throw new HttpError(404, "ไม่พบยานี้");
    const newQty = existing.stockQty + delta;
    if (newQty < 0) throw new HttpError(400, "จำนวนยาคงเหลือไม่พอ");
    const [med] = await prisma.$transaction([
      prisma.medication.update({
        where: { id: req.params.id },
        data: { stockQty: newQty },
      }),
      prisma.medicationMovement.create({
        data: {
          medicationId: req.params.id,
          delta,
          balanceAfter: newQty,
          reason: reason || null,
          recordedById: req.user?.sub ?? null,
        },
      }),
    ]);
    res.json({ medication: med });
  } catch (err) {
    next(err);
  }
});

// รายละเอียดยา: ข้อมูล + ประวัติรับเข้า/จ่ายออก + นักเรียนที่ใช้ยานี้
router.get("/:id/detail", async (req, res, next) => {
  try {
    const medication = await prisma.medication.findUnique({
      where: { id: req.params.id },
    });
    if (!medication) throw new HttpError(404, "ไม่พบยานี้");

    const movements = await prisma.medicationMovement.findMany({
      where: { medicationId: medication.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const drugKey = normalizeDrugName(medication.drugName).toLowerCase();
    const firstWord = drugKey.split(" ")[0] ?? "";
    const students = await prisma.student.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        classRoom: true,
        dormitory: true,
        regularMedication: true,
        medicationData: true,
      },
    });
    const usedBy = students
      .filter((student) =>
        extractStudentMedicationNames(student).some((name) => {
          const n = name.toLowerCase();
          return (
            n.includes(drugKey) ||
            drugKey.includes(n) ||
            (firstWord.length >= 4 && n.includes(firstWord))
          );
        }),
      )
      .map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        classRoom: s.classRoom,
        dormitory: s.dormitory,
      }));

    res.json({ medication, movements, students: usedBy });
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
