import express, { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/rbac.middleware.js";
import { HttpError } from "../middleware/error.middleware.js";
import {
  objectPath,
  STUDENT_PHOTOS_BUCKET,
  uploadObject,
} from "../lib/supabaseStorage.js";

const router = Router();
router.use(authMiddleware);

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function bodyBuffer(body: unknown) {
  return Buffer.isBuffer(body) ? body : Buffer.alloc(0);
}

router.post(
  "/student-photo",
  requireAdmin,
  express.raw({ type: "image/*", limit: "5mb" }),
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
        throw new HttpError(400, "รูปภาพต้องมีขนาดไม่เกิน 5 MB");
      }

      const uploaded = await uploadObject({
        bucketId: STUDENT_PHOTOS_BUCKET,
        path: objectPath("students", originalName),
        buffer,
        contentType,
      });

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
