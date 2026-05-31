-- CreateEnum
CREATE TYPE "StudentHandoffType" AS ENUM ('check_in', 'check_out');

-- CreateTable
CREATE TABLE "student_handoffs" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "handoff_type" "StudentHandoffType" NOT NULL,
    "handoff_date" DATE NOT NULL,
    "handoff_time" VARCHAR(5) NOT NULL,
    "companion_name" VARCHAR(120) NOT NULL,
    "companion_phone" VARCHAR(30),
    "nurse_name" VARCHAR(120) NOT NULL,
    "notes" TEXT,
    "recorded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_handoffs_student_id_idx" ON "student_handoffs"("student_id");

-- CreateIndex
CREATE INDEX "student_handoffs_handoff_date_idx" ON "student_handoffs"("handoff_date");

-- CreateIndex
CREATE INDEX "student_handoffs_handoff_type_handoff_date_idx" ON "student_handoffs"("handoff_type", "handoff_date");

-- AddForeignKey
ALTER TABLE "student_handoffs" ADD CONSTRAINT "student_handoffs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_handoffs" ADD CONSTRAINT "student_handoffs_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
