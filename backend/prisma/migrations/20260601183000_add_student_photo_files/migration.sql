CREATE TABLE "student_photo_files" (
  "id" TEXT NOT NULL,
  "mime_type" VARCHAR(120) NOT NULL,
  "data" BYTEA NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "student_photo_files_pkey" PRIMARY KEY ("id")
);
