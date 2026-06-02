ALTER TABLE "pm25_records"
  ADD COLUMN "measurement_points" JSONB NOT NULL DEFAULT '[]';

UPDATE "pm25_records"
SET "measurement_points" = jsonb_build_array(
  jsonb_build_object(
    'id', "id" || '-legacy',
    'location', 'จุดวัดหลัก',
    'pm25Value', ("pm25_value")::numeric
  )
)
WHERE "measurement_points" = '[]'::jsonb;
