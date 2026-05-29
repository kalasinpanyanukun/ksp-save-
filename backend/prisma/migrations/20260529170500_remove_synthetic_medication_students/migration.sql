DELETE FROM "students"
WHERE "student_code" LIKE '%-MED-%'
  AND COALESCE("first_name", '') = '-'
  AND COALESCE("last_name", '') = '-'
  AND NOT EXISTS (
    SELECT 1 FROM "opd_visits" WHERE "opd_visits"."student_id" = "students"."id"
  )
  AND NOT EXISTS (
    SELECT 1 FROM "admissions" WHERE "admissions"."student_id" = "students"."id"
  )
  AND NOT EXISTS (
    SELECT 1 FROM "referrals" WHERE "referrals"."student_id" = "students"."id"
  );
