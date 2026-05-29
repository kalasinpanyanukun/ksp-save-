UPDATE "users"
SET
  "username" = 'Super Admin',
  "full_name" = 'ผู้ดูแลระบบ',
  "role" = 'super_admin',
  "is_active" = true
WHERE "username" = 'admin'
  AND NOT EXISTS (
    SELECT 1
    FROM "users" existing
    WHERE existing."username" = 'Super Admin'
  );

UPDATE "users"
SET
  "role" = 'super_admin',
  "is_active" = true
WHERE "username" = 'Super Admin';
