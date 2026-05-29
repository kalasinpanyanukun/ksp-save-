CREATE TYPE "StudentStatus" AS ENUM ('resident', 'infirmary', 'home_leave');

ALTER TABLE "students"
ADD COLUMN "student_status" "StudentStatus" NOT NULL DEFAULT 'resident';

