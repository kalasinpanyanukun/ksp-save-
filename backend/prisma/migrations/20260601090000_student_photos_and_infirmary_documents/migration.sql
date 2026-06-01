-- Add student photo metadata
ALTER TABLE "students"
ADD COLUMN "photo_url" TEXT,
ADD COLUMN "photo_path" TEXT,
ADD COLUMN "photo_mime_type" VARCHAR(120),
ADD COLUMN "photo_size" INTEGER;

-- Create infirmary document registry
CREATE TABLE "infirmary_documents" (
  "id" TEXT NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "file_name" VARCHAR(255) NOT NULL,
  "file_url" TEXT NOT NULL,
  "file_path" TEXT NOT NULL,
  "mime_type" VARCHAR(120) NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "uploaded_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "infirmary_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "infirmary_documents_created_at_idx" ON "infirmary_documents"("created_at");
CREATE INDEX "infirmary_documents_uploaded_by_idx" ON "infirmary_documents"("uploaded_by");

ALTER TABLE "infirmary_documents"
ADD CONSTRAINT "infirmary_documents_uploaded_by_fkey"
FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
