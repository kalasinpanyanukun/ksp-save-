import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: "ไม่พบเส้นทาง API ที่ต้องการ" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "ข้อมูลไม่ถูกต้อง",
      errors: err.flatten().fieldErrors,
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  if (
    err &&
    typeof err === "object" &&
    "type" in err &&
    (err as { type?: string }).type === "entity.too.large"
  ) {
    res.status(413).json({ message: "ไฟล์หรือข้อมูลที่อัปโหลดมีขนาดใหญ่เกินกำหนด" });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ message: "ข้อมูลซ้ำในระบบ" });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ message: "ไม่พบข้อมูลที่ระบุ" });
      return;
    }
  }
  console.error("[error]", err);
  res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
}
