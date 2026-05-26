# KSP SAVE+

ระบบบริหารจัดการเรือนพยาบาลออนไลน์ — โรงเรียนกาฬสินธุ์ปัญญานุกูล

โปรแกรมเว็บออนไลน์สำหรับบันทึก ติดตาม และวิเคราะห์การเข้ารับบริการเรือนพยาบาลในสถานศึกษา ใช้งานผ่าน browser ทุกอุปกรณ์

## สถาปัตยกรรม

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS (โทนสีฟ้า/ขาว)
- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **Database:** Supabase PostgreSQL (managed)
- **Auth:** JWT access token (8 ชม.) + refresh token (7 วัน) + RBAC

## โครงสร้างโฟลเดอร์

```
KSP SAVE+/
├── frontend/       # React + Vite + Tailwind
├── backend/        # Express + Prisma + JWT
├── Image/          # โลโก้และ concept art
└── package.json    # root scripts (concurrently)
```

## ขั้นตอนติดตั้ง

### 1. ติดตั้ง dependency ทั้งหมด

```bash
npm run install:all
```

### 2. ตั้งค่า environment variables

คัดลอกไฟล์ตัวอย่างแล้วแก้ค่าให้ตรงกับ Supabase ของคุณ:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

`backend/.env` ที่ต้องตั้ง:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="<random-long-string-1>"
JWT_REFRESH_SECRET="<random-long-string-2>"
JWT_EXPIRES_IN="8h"
JWT_REFRESH_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
PORT=3001
```

> `DATABASE_URL` ใช้ pooler 6543 สำหรับงาน runtime, `DIRECT_URL` ใช้ port 5432 สำหรับ Prisma migrate

### 3. รัน Prisma migrate + seed

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

### 4. รันระบบ (backend + frontend พร้อมกัน)

```bash
npm run dev
```

เปิด: `http://localhost:5173`

ค่า login เริ่มต้นหลัง seed:

```
username: admin
password: ChangeMe123!
```

## คำสั่งสำคัญ

```bash
npm run dev              # รัน backend + frontend
npm run dev:backend      # รัน API อย่างเดียว
npm run dev:frontend     # รัน frontend อย่างเดียว
npm run typecheck        # ตรวจ TypeScript ทั้งระบบ
npm run build            # build production
npm run prisma:migrate   # apply schema ไป Supabase
npm run seed             # seed admin + ข้อมูลตั้งต้น
```

## ผู้ใช้งานและสิทธิ์

| บทบาท | สิทธิ์ |
|-------|--------|
| `admin` (ครูเรือนพยาบาล) | ทุกอย่าง + จัดการผู้ใช้ + ตั้งค่าระบบ |
| `nurse_assistant` (พี่เลี้ยง) | บันทึก/ค้นหา/ดูรายงาน + Export PDF |

## โทนสี KSP SAVE+

| โทเค็น | Hex | การใช้ |
|--------|-----|-------|
| Primary Navy | `#0D2B45` | Sidebar, หัวข้อสำคัญ |
| Primary Blue | `#2077C7` | ปุ่ม, แถบนำทาง, link |
| Accent Blue | `#4DB6E6` | จุดเน้น, badge, hover |
| Neutral Gray | `#707ABA` | ตัวอักษรรอง, divider |
| Background | `#F2F6FA` | พื้นหลังหน้า, card secondary |

## หมายเหตุความปลอดภัย

- ห้าม log ข้อมูลผู้ป่วยลง console ใน production
- ตั้ง `JWT_SECRET` และ `JWT_REFRESH_SECRET` ให้ยาวและสุ่มจริง (≥32 ตัวอักษร)
- ใช้ UTF-8 ทุกไฟล์เพื่อรองรับภาษาไทย
- กำหนด `CORS_ORIGIN` ให้ตรงกับ domain ของ frontend ตอน deploy
