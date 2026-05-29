ALTER TABLE "users" ADD COLUMN "password_display" VARCHAR(255);

UPDATE "users"
SET
  "full_name" = 'ผู้พัฒนาระบบ',
  "password_display" = COALESCE("password_display", '@ksp123456')
WHERE "role" = 'super_admin';

UPDATE "users"
SET "full_name" = 'ผู้ดูแลระบบ'
WHERE "role" = 'admin' AND ("full_name" = 'Admin' OR "username" = 'admin');

ALTER TABLE "students" ADD COLUMN "health_data" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "students" ADD COLUMN "medication_data" JSONB NOT NULL DEFAULT '{}';
