import type { NextFunction, Request, Response } from "express";

type Role = "super_admin" | "admin" | "nurse_assistant";

export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "ไม่ได้รับอนุญาต" });
      return;
    }
    if (!allowed.includes(req.user.role)) {
      res.status(403).json({ message: "สิทธิ์ไม่เพียงพอ" });
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole("super_admin", "admin");
export const requireSuperAdmin = requireRole("super_admin");
