-- CreateTable
CREATE TABLE "dorm_teachers" (
    "dormitory" VARCHAR(50) NOT NULL,
    "teacher" VARCHAR(200) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dorm_teachers_pkey" PRIMARY KEY ("dormitory")
);
