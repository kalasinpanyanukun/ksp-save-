import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken, type JwtPayload } from "../lib/tokens.js";
import { prisma } from "../lib/prisma.js";

// throttle การอัปเดต lastSeenAt (ต่อ user ไม่เกิน 1 ครั้ง/นาที) เพื่อบอกว่าใครออนไลน์อยู่
const lastSeenWrites = new Map<string, number>();
function touchLastSeen(userId: string) {
  const now = Date.now();
  if (now - (lastSeenWrites.get(userId) ?? 0) < 60_000) return;
  lastSeenWrites.set(userId, now);
  prisma.user
    .update({ where: { id: userId }, data: { lastSeenAt: new Date() } })
    .catch(() => {});
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ" });
    return;
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    req.user = verifyAccessToken(token);
    if (req.user?.sub) touchLastSeen(req.user.sub);
    next();
  } catch {
    res.status(401).json({ message: "Token หมดอายุ กรุณาเข้าสู่ระบบใหม่" });
  }
}
