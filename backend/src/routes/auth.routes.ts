import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { verifyPassword } from "../lib/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/tokens.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { HttpError } from "../middleware/error.middleware.js";
import { writeAuditLogSafe } from "../lib/audit.js";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { username: body.username },
    });
    if (!user || !user.isActive) {
      throw new HttpError(401, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) {
      throw new HttpError(401, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    } as const;
    writeAuditLogSafe({
      req,
      userId: user.id,
      action: "LOGIN",
      entity: "auth",
      entityId: user.id,
      diff: { username: user.username },
    });
    res.json({
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

router.post("/refresh-token", async (req, res, next) => {
  try {
    const body = refreshSchema.parse(req.body);
    let payload;
    try {
      payload = verifyRefreshToken(body.refreshToken);
    } catch {
      throw new HttpError(401, "Refresh token ไม่ถูกต้อง");
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new HttpError(401, "ผู้ใช้ถูกระงับการใช้งาน");
    }
    const next_payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    } as const;
    res.json({
      accessToken: signAccessToken(next_payload),
      refreshToken: signRefreshToken(next_payload),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });
    if (!user) throw new HttpError(404, "ไม่พบข้อมูลผู้ใช้");
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", authMiddleware, (req, res) => {
  writeAuditLogSafe({
    req,
    userId: req.user?.sub,
    action: "LOGOUT",
    entity: "auth",
    entityId: req.user?.sub,
    diff: { username: req.user?.username },
  });
  res.json({ ok: true });
});

export default router;
