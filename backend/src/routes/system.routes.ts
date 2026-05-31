import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

// ความจุฐานข้อมูลตามแพ็กเกจ (MB) — ปรับผ่าน env ได้ (Supabase free = 500MB)
const DB_LIMIT_MB = Number(process.env.SUPABASE_DB_LIMIT_MB ?? 500);
const ACTIVE_WINDOW_MIN = 5;

router.get("/status", requireAdmin, async (_req, res, next) => {
  try {
    // ขนาดฐานข้อมูลจริงจาก Postgres
    const sizeRows = await prisma.$queryRaw<{ bytes: bigint }[]>`
      SELECT pg_database_size(current_database()) AS bytes
    `;
    const usedBytes = Number(sizeRows[0]?.bytes ?? 0);
    const totalBytes = DB_LIMIT_MB * 1024 * 1024;
    const usedPct = totalBytes > 0 ? Math.min(100, (usedBytes / totalBytes) * 100) : 0;

    // บัญชีที่กำลังใช้งาน (มี activity ภายใน N นาที)
    const since = new Date(Date.now() - ACTIVE_WINDOW_MIN * 60_000);
    const activeUsers = await prisma.user.findMany({
      where: { lastSeenAt: { gte: since } },
      select: { id: true, fullName: true, username: true, role: true, lastSeenAt: true },
      orderBy: { lastSeenAt: "desc" },
    });

    res.json({
      database: {
        usedBytes,
        totalBytes,
        usedPct,
        limitMb: DB_LIMIT_MB,
      },
      activeUsers,
      activeWindowMin: ACTIVE_WINDOW_MIN,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
