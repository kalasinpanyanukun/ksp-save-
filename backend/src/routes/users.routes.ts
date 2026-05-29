import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/rbac.middleware.js";
import { HttpError } from "../middleware/error.middleware.js";

const router = Router();
router.use(authMiddleware);

const userPublicSelect = {
  id: true,
  username: true,
  fullName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

function requesterIsSuperAdmin(role: string | undefined) {
  return role === "super_admin";
}

function assertCanAccessSensitiveUser(
  requesterRole: string | undefined,
  targetRole: string,
) {
  if (targetRole === "super_admin" && !requesterIsSuperAdmin(requesterRole)) {
    throw new HttpError(403, "ไม่สามารถดำเนินการกับบัญชีผู้พัฒนาระบบได้");
  }
}

router.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: userPublicSelect,
    });
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "username อย่างน้อย 3 ตัวอักษร")
    .max(50),
  password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
  fullName: z.string().trim().min(1, "กรุณาระบุชื่อ-สกุล").max(100),
  role: z.enum(["admin", "nurse_assistant"]),
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        username: body.username,
        passwordHash,
        passwordDisplay: body.password,
        fullName: body.fullName,
        role: body.role,
      },
      select: userPublicSelect,
    });
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  fullName: z.string().trim().min(1).max(100).optional(),
  role: z.enum(["admin", "nurse_assistant"]).optional(),
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
    const existing = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { role: true },
    });
    if (!existing) throw new HttpError(404, "ไม่พบผู้ใช้");
    assertCanAccessSensitiveUser(req.user?.role, existing.role);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: body,
      select: userPublicSelect,
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/password", requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { role: true, passwordDisplay: true },
    });
    if (!existing) throw new HttpError(404, "ไม่พบผู้ใช้");
    assertCanAccessSensitiveUser(req.user?.role, existing.role);
    res.json({ password: existing.passwordDisplay ?? null });
  } catch (err) {
    next(err);
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านเดิม"),
  newPassword: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
});

router.post("/me/change-password", async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw new HttpError(404, "ไม่พบผู้ใช้");
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) throw new HttpError(401, "รหัสผ่านปัจจุบันไม่ถูกต้อง");
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordDisplay: newPassword },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/change-password", requireAdmin, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const existing = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, role: true, passwordHash: true },
    });
    if (!existing) throw new HttpError(404, "ไม่พบผู้ใช้");
    assertCanAccessSensitiveUser(req.user?.role, existing.role);

    const ok = await verifyPassword(currentPassword, existing.passwordHash);
    if (!ok) throw new HttpError(401, "รหัสผ่านเดิมไม่ถูกต้อง");

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, passwordDisplay: newPassword },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    if (req.params.id === req.user!.sub) {
      throw new HttpError(400, "ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้");
    }

    const existing = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { role: true },
    });
    if (!existing) throw new HttpError(404, "ไม่พบผู้ใช้");
    if (existing.role === "super_admin") {
      throw new HttpError(403, "ไม่สามารถลบบัญชีผู้พัฒนาระบบได้");
    }

    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
