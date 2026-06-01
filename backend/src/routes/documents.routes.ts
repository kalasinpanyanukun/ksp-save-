import express, { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/rbac.middleware.js";
import { HttpError } from "../middleware/error.middleware.js";
import {
  INFIRMARY_DOCUMENTS_BUCKET,
  objectPath,
  safeFileName,
  uploadObject,
} from "../lib/supabaseStorage.js";

const router = Router();
router.use(authMiddleware);

const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;

function bodyBuffer(body: unknown) {
  return Buffer.isBuffer(body) ? body : Buffer.alloc(0);
}

function decodeHeader(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

const createDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
});

router.get("/", async (_req, res, next) => {
  try {
    const data = await prisma.infirmaryDocument.findMany({
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: { select: { id: true, fullName: true } } },
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const document = await prisma.infirmaryDocument.findUnique({
      where: { id: req.params.id },
      include: { uploadedBy: { select: { id: true, fullName: true } } },
    });
    if (!document) throw new HttpError(404, "ไม่พบเอกสาร");
    res.json({ document });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  requireAdmin,
  express.raw({ type: "*/*", limit: "50mb" }),
  async (req, res, next) => {
    try {
      const buffer = bodyBuffer(req.body);
      if (!req.user?.sub) throw new HttpError(401, "ไม่ได้รับอนุญาต");
      if (buffer.length === 0) throw new HttpError(400, "ไม่พบไฟล์เอกสาร");
      if (buffer.length > MAX_DOCUMENT_BYTES) {
        throw new HttpError(400, "ไฟล์เอกสารต้องมีขนาดไม่เกิน 50 MB");
      }

      const fileName = safeFileName(decodeHeader(req.headers["x-file-name"]) || "document");
      const title = decodeHeader(req.headers["x-document-title"]) || fileName;
      const description = decodeHeader(req.headers["x-document-description"]);
      const mimeType = String(req.headers["content-type"] ?? "application/octet-stream");

      const body = createDocumentSchema.parse({
        title,
        description,
        fileName,
        mimeType,
      });
      const uploaded = await uploadObject({
        bucketId: INFIRMARY_DOCUMENTS_BUCKET,
        path: objectPath("documents", body.fileName),
        buffer,
        contentType: body.mimeType,
      });

      const document = await prisma.infirmaryDocument.create({
        data: {
          title: body.title,
          description: body.description || null,
          fileName: body.fileName,
          fileUrl: uploaded.url,
          filePath: uploaded.path,
          mimeType: body.mimeType,
          sizeBytes: buffer.length,
          uploadedById: req.user.sub,
        },
        include: { uploadedBy: { select: { id: true, fullName: true } } },
      });

      res.status(201).json({ document });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
