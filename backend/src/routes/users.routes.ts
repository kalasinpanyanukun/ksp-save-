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

router.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: userPublicSelect,
    });
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  username: z.string().trim().min(3, "username อย่างน้อย 3 ตัวอักษร").max(50),
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
  isActive: z.boolean().optional(),
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
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

const resetSchema = z.object({
  newPassword: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
});

router.post("/:id/reset-password", requireAdmin, async (req, res, next) => {
  try {
    const { newPassword } = resetSchema.parse(req.body);
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
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
      data: { passwordHash },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
