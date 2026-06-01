import express, { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/rbac.middleware.js";
import { HttpError } from "../middleware/error.middleware.js";
import {
  objectPath,
  STUDENT_PHOTOS_BUCKET,
  uploadObject,
} from "../lib/supabaseStorage.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

function bodyBuffer(body: unknown) {
  return Buffer.isBuffer(body) ? body : Buffer.alloc(0);
}

router.get("/student-photo-file/:id", async (req, res, next) => {
  try {
    const photo = await prisma.studentPhotoFile.findUnique({
      where: { id: req.params.id },
    });

    if (!photo) throw new HttpError(404, "ไม่พบรูปนักเรียน");

    res.setHeader("cache-control", "public, max-age=31536000, immutable");
    res.type(photo.mimeType);
    res.send(Buffer.from(photo.data));
  } catch (err) {
    next(err);
  }
});

router.use(authMiddleware);

router.post(
  "/student-photo",
  requireAdmin,
  express.raw({ type: "image/*", limit: "2mb" }),
  async (req, res, next) => {
    try {
      const buffer = bodyBuffer(req.body);
      const contentType = String(req.headers["content-type"] ?? "");
      const originalName = String(req.headers["x-file-name"] ?? "student-photo");

      if (!contentType.startsWith("image/")) {
        throw new HttpError(400, "อัปโหลดได้เฉพาะไฟล์รูปภาพเท่านั้น");
      }
      if (buffer.length === 0) throw new HttpError(400, "ไม่พบไฟล์รูปภาพ");
      if (buffer.length > MAX_PHOTO_BYTES) {
        throw new HttpError(400, "รูปภาพต้องมีขนาดไม่เกิน 2 MB");
      }

      let uploaded: { url: string; path: string };
      try {
        uploaded = await uploadObject({
          bucketId: STUDENT_PHOTOS_BUCKET,
          path: objectPath("students", originalName),
          buffer,
          contentType,
        });
      } catch (err) {
        console.warn(
          "[uploads] Supabase Storage unavailable, using database photo fallback:",
          err instanceof Error ? err.message : err,
        );
        const photo = await prisma.studentPhotoFile.create({
          data: {
            mimeType: contentType,
            data: buffer,
            sizeBytes: buffer.length,
          },
        });
        uploaded = {
          path: `db:${photo.id}`,
          url: `/api/uploads/student-photo-file/${photo.id}`,
        };
      }

      res.status(201).json({
        url: uploaded.url,
        path: uploaded.path,
        mimeType: contentType,
        size: buffer.length,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
