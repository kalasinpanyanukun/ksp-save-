import type { NextFunction, Request, Response } from "express";
import { bodyFieldNames, writeAuditLogSafe } from "../lib/audit.js";

const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const ignoredPaths = [
  /^\/api\/health\b/,
  /^\/api\/audit-logs\b/,
  /^\/api\/auth\/login\b/,
  /^\/api\/auth\/logout\b/,
  /^\/api\/auth\/refresh-token\b/,
];

function actionFromMethod(method: string) {
  if (method === "POST") return "CREATE";
  if (method === "PUT" || method === "PATCH") return "UPDATE";
  if (method === "DELETE") return "DELETE";
  return method;
}

function partsFromPath(path: string) {
  const clean = path.replace(/^\/api\/?/, "").split("?")[0] ?? "";
  const parts = clean.split("/").filter(Boolean);
  return {
    entity: parts[0] ?? "system",
    entityId: parts[1] && parts[1] !== "me" ? parts[1] : null,
  };
}

export function auditActivityMiddleware(req: Request, res: Response, next: NextFunction) {
  const path = req.originalUrl.split("?")[0] ?? req.originalUrl;
  if (!mutatingMethods.has(req.method) || ignoredPaths.some((pattern) => pattern.test(path))) {
    next();
    return;
  }

  res.on("finish", () => {
    if (res.statusCode >= 400 || !req.user?.sub) return;
    const { entity, entityId } = partsFromPath(req.originalUrl);
    writeAuditLogSafe({
      req,
      userId: req.user.sub,
      action: actionFromMethod(req.method),
      entity,
      entityId,
      diff: {
        method: req.method,
        path,
        fields: bodyFieldNames(req.body),
      },
    });
  });

  next();
}
