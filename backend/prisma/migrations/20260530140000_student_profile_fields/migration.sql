-- AlterTable
ALTER TABLE "students"
  ADD COLUMN "nickname" VARCHAR(50),
  ADD COLUMN "homeroom_teacher_phone" VARCHAR(20),
  ADD COLUMN "guardians" JSONB NOT NULL DEFAULT '[]';
