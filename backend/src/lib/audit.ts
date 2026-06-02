import type { Request } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

const hiddenFieldPattern = /password|token|secret|hash|display/i;

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() || req.ip || null;
  }
  return req.ip || req.socket.remoteAddress || null;
}

export function bodyFieldNames(body: unknown): string[] {
  if (!body || typeof body !== "object" || Array.isArray(body)) return [];
  return Object.keys(body as Record<string, unknown>).filter(
    (key) => !hiddenFieldPattern.test(key),
  );
}

export async function writeAuditLog({
  req,
  userId,
  action,
  entity,
  entityId,
  diff,
}: {
  req: Request;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  diff?: Prisma.InputJsonValue | null;
}) {
  await prisma.auditLog.create({
    data: {
      userId: userId ?? null,
      action,
      entity,
      entityId: entityId ?? null,
      diff: diff ?? Prisma.JsonNull,
      ipAddress: clientIp(req),
    },
  });
}

export function writeAuditLogSafe(args: Parameters<typeof writeAuditLog>[0]) {
  writeAuditLog(args).catch((error) => {
    console.warn("[audit] write failed", error);
  });
}
