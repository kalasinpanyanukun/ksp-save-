-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'nurse_assistant');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A', 'B', 'AB', 'O', 'unknown');

-- CreateEnum
CREATE TYPE "DischargeDestination" AS ENUM ('dormitory', 'home', 'hospital', 'other');

-- CreateEnum
CREATE TYPE "AqiLevel" AS ENUM ('good', 'moderate', 'unhealthy_sensitive', 'unhealthy', 'very_unhealthy', 'hazardous');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'nurse_assistant',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "student_code" VARCHAR(20) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "class_room" VARCHAR(20),
    "dormitory" VARCHAR(50),
    "homeroom_teacher" VARCHAR(100),
    "blood_type" "BloodType" NOT NULL DEFAULT 'unknown',
    "congenital_disease" TEXT,
    "drug_allergy" TEXT,
    "regular_medication" TEXT,
    "parent_name" VARCHAR(100),
    "parent_phone" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opd_visits" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "visit_date" DATE NOT NULL,
    "visit_time" VARCHAR(5) NOT NULL,
    "chief_complaint" TEXT NOT NULL,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "medications" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "recorded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opd_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admissions" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "admit_date" DATE NOT NULL,
    "admit_time" VARCHAR(5) NOT NULL,
    "chief_complaint" TEXT NOT NULL,
    "discharge_date" DATE,
    "discharge_time" VARCHAR(5),
    "discharge_destination" "DischargeDestination",
    "total_days" INTEGER,
    "notes" TEXT,
    "recorded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "referral_date" DATE NOT NULL,
    "referral_time" VARCHAR(5) NOT NULL,
    "chief_complaint" TEXT NOT NULL,
    "referred_to" VARCHAR(200) NOT NULL,
    "treatment_given" TEXT,
    "notes" TEXT,
    "recorded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "drug_code" VARCHAR(20) NOT NULL,
    "drug_name" VARCHAR(200) NOT NULL,
    "drug_type" VARCHAR(50),
    "unit" VARCHAR(20),
    "stock_qty" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm25_records" (
    "id" TEXT NOT NULL,
    "record_date" DATE NOT NULL,
    "record_time" VARCHAR(5) NOT NULL,
    "pm25_value" DECIMAL(6,2) NOT NULL,
    "aqi_level" "AqiLevel" NOT NULL,
    "notes" TEXT,
    "recorded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm25_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" VARCHAR(50) NOT NULL,
    "entity" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(64),
    "diff" JSONB,
    "ip_address" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_code_key" ON "students"("student_code");

-- CreateIndex
CREATE INDEX "students_first_name_last_name_idx" ON "students"("first_name", "last_name");

-- CreateIndex
CREATE INDEX "students_class_room_idx" ON "students"("class_room");

-- CreateIndex
CREATE INDEX "students_dormitory_idx" ON "students"("dormitory");

-- CreateIndex
CREATE INDEX "opd_visits_student_id_idx" ON "opd_visits"("student_id");

-- CreateIndex
CREATE INDEX "opd_visits_visit_date_idx" ON "opd_visits"("visit_date");

-- CreateIndex
CREATE INDEX "admissions_student_id_idx" ON "admissions"("student_id");

-- CreateIndex
CREATE INDEX "admissions_admit_date_idx" ON "admissions"("admit_date");

-- CreateIndex
CREATE INDEX "admissions_discharge_date_idx" ON "admissions"("discharge_date");

-- CreateIndex
CREATE INDEX "referrals_student_id_idx" ON "referrals"("student_id");

-- CreateIndex
CREATE INDEX "referrals_referral_date_idx" ON "referrals"("referral_date");

-- CreateIndex
CREATE UNIQUE INDEX "medications_drug_code_key" ON "medications"("drug_code");

-- CreateIndex
CREATE INDEX "pm25_records_record_date_idx" ON "pm25_records"("record_date");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- AddForeignKey
ALTER TABLE "opd_visits" ADD CONSTRAINT "opd_visits_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opd_visits" ADD CONSTRAINT "opd_visits_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm25_records" ADD CONSTRAINT "pm25_records_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
