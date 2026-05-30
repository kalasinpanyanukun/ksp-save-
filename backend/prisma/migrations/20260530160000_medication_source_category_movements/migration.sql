-- AlterTable
ALTER TABLE "medications"
  ADD COLUMN "source" VARCHAR(40) NOT NULL DEFAULT 'เรือนพยาบาล',
  ADD COLUMN "category" VARCHAR(20) NOT NULL DEFAULT 'medicine';

-- Backfill source from existing drug_type
UPDATE "medications" SET "source" = 'ยาประจำตัวนักเรียน' WHERE "drug_type" = 'ยาประจำตัวนักเรียน';

-- CreateTable
CREATE TABLE "medication_movements" (
    "id" TEXT NOT NULL,
    "medication_id" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "reason" TEXT,
    "recorded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medication_movements_medication_id_created_at_idx" ON "medication_movements"("medication_id", "created_at");

-- AddForeignKey
ALTER TABLE "medication_movements" ADD CONSTRAINT "medication_movements_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
