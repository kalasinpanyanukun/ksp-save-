# KSP SAVE+ — คู่มือการ Deploy

## แผนฟรีที่ใช้จริงตอนนี้: Vercel Functions + Supabase

โปรเจกต์นี้สามารถ deploy แบบฟรีโดยใช้ **GitHub + Vercel + Supabase** ได้ โดยให้ Vercel ทำ 2 หน้าที่:

1. เสิร์ฟหน้าเว็บ React/Vite จาก `frontend/dist`
2. รัน Express backend เดิมผ่าน Vercel Functions ที่ `/api/*`

ไม่ต้องใช้ Render ถ้าผู้ใช้น้อยและงานหลักคือ login, บันทึกข้อมูล, ค้นข้อมูล, และดูรายงานทั่วไป

### ตั้งค่า Vercel Project

แนะนำให้ตั้ง **Root Directory เป็น repo root** หรือปล่อยว่าง ไม่ใช่ `frontend` เพื่อให้ Vercel เห็นทั้ง `api/`, `backend/`, `frontend/`, และ `vercel.json` ที่ root

ค่าที่ config ไว้ใน `vercel.json`:

- Install: `npm install && npm --prefix backend install && npm --prefix frontend install`
- Build: generate Prisma client, deploy migrations, build backend, build frontend
- Output: `frontend/dist`
- Function region: `sin1` เพื่อให้อยู่ใกล้ Supabase Singapore
- SPA fallback: route อื่น ๆ ที่ไม่ใช่ `/api/*` จะกลับไปที่ `index.html`

### Environment Variables บน Vercel

ตั้งค่าต่อไปนี้ใน Vercel → Project → Settings → Environment Variables:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="random-long-string-at-least-32-chars"
JWT_REFRESH_SECRET="another-random-long-string-at-least-32-chars"
JWT_EXPIRES_IN="8h"
JWT_REFRESH_EXPIRES_IN="7d"
CORS_ORIGIN="https://ksp-save.vercel.app"
NODE_ENV="production"
VITE_API_URL="/api"
VITE_APP_NAME="KSP SAVE+"
```

หลังตั้ง env แล้วให้ redeploy จาก Vercel หรือ push commit ใหม่ไป GitHub

### ตรวจหลัง Deploy

1. เปิด `https://ksp-save.vercel.app/api/health`
2. ต้องได้ JSON เช่น `{ "status": "ok", "db": "up" }`
3. ถ้าได้หน้า HTML แปลว่า Vercel ยัง route `/api/*` ไป frontend อยู่ ให้ตรวจ Root Directory และ `vercel.json`
4. Login ด้วย `admin / ChangeMe123!` แล้วทดสอบบันทึกข้อมูลจริง

ระบบประกอบด้วย 3 ชิ้นที่ deploy แยกกันได้:

1. **Database** — Supabase Postgres (managed) หรือ PostgreSQL ที่ host เอง
2. **Backend API** — Node.js + Express + Prisma (พอร์ต 3001)
3. **Frontend** — React + Vite static SPA

## 1. เตรียม Supabase

1. สร้าง project ใหม่ที่ <https://app.supabase.com> (เลือก region ที่ใกล้ที่สุด เช่น Singapore)
2. ไปที่ **Project Settings → Database → Connection string** เก็บค่า:
   - `URI (pooler)` พอร์ต 6543 → ใช้เป็น `DATABASE_URL`
   - `URI (direct)` พอร์ต 5432 → ใช้เป็น `DIRECT_URL`
3. ในเครื่อง dev ให้รันครั้งเดียวเพื่อสร้างตาราง:

```bash
cd backend
copy .env.example .env
# แก้ DATABASE_URL, DIRECT_URL ในไฟล์ .env
npx prisma migrate dev
npm run seed
```

หลังจากนี้ Supabase จะมีตารางทั้งหมดของระบบ และมี user `admin / ChangeMe123!`

## 2. Backend API

แนะนำ host:

| ตัวเลือก | เหมาะกับ | ข้อดี |
|----------|----------|------|
| **Render.com** | ฟรีก็ใช้ได้ | UI ง่าย, GitHub auto-deploy |
| **Fly.io** | คุม resource ดี | Region ใกล้ไทย, free tier |
| **Railway** | One-click | UI สวย, แต่ราคามากกว่า |
| **VPS** (Ubuntu + PM2 + Nginx) | คุม cost | ราคาถูกที่สุด |

ตัวอย่างขั้นตอน Render:

1. Push โค้ดไป GitHub
2. Render → New → Web Service → connect repo
3. **Root Directory:** `backend`
4. **Build Command:** `npm install && npx prisma generate && npm run build`
5. **Start Command:** `node dist/src/index.js`
6. กำหนด env vars: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`
7. หลัง deploy แล้ว ทดสอบ `GET /api/health`

### ตั้งค่าสำคัญฝั่ง production

- `CORS_ORIGIN` ต้องเป็น URL จริงของ frontend ที่ deploy เช่น `https://ksp-save.vercel.app`
- `JWT_SECRET`, `JWT_REFRESH_SECRET` ต้องสุ่มจริง (≥32 ตัวอักษร) อย่าใช้ค่าใน `.env.example`
- `NODE_ENV=production` เพื่อปิด log ที่ละเอียดเกินไป

## 3. Frontend

แนะนำ host:

| ตัวเลือก | เหมาะกับ | หมายเหตุ |
|----------|----------|----------|
| **Vercel** | ง่ายที่สุด | Auto-deploy จาก git, ฟรี |
| **Netlify** | ใกล้เคียง Vercel | Auto-deploy เช่นกัน |
| **Cloudflare Pages** | เน้น CDN | ฟรี traffic ไม่จำกัด |
| **Nginx ใน VPS** | ต้องการคุมเอง | serve static files |

ตัวอย่างขั้นตอน Vercel:

1. Vercel → New Project → import repo
2. **Root Directory:** `frontend`
3. Framework: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Environment variables:
   - `VITE_API_URL=https://your-backend.onrender.com/api`
   - `VITE_APP_NAME=KSP SAVE+`

หลัง deploy เสร็จ ใส่ URL ของ frontend กลับไปใน backend `CORS_ORIGIN`

## 4. การ migrate ครั้งถัดไป

ทุกครั้งที่แก้ `prisma/schema.prisma`:

```bash
cd backend
npx prisma migrate dev --name describe_change
git commit -am "migration: describe_change"
git push
```

Render/Fly จะ rebuild backend อัตโนมัติ และต้องตั้งให้ build step มี `npx prisma migrate deploy` เพื่อ apply migration บน production:

```
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

## 5. การสำรองข้อมูล (Backup)

- Supabase free tier: backup ทุก 24 ชั่วโมง เก็บ 7 วัน — ดูที่ Project Settings → Database → Backups
- แนะนำให้มี script export ฐานข้อมูลรายสัปดาห์มาเก็บนอก Supabase ด้วย เช่น `pg_dump` จาก server เก่า

## 6. Checklist ก่อนใช้งานจริง

- [ ] เปลี่ยนรหัสผ่าน admin จาก `ChangeMe123!` เป็นรหัสที่ปลอดภัย
- [ ] สุ่ม `JWT_SECRET` และ `JWT_REFRESH_SECRET` ใหม่ ≥32 ตัวอักษร
- [ ] ตั้ง `CORS_ORIGIN` ให้ตรง domain จริง
- [ ] เพิ่ม user พี่เลี้ยงทุกคนที่ต้องใช้งาน
- [ ] import รายชื่อนักเรียนปัจจุบันจาก Google Sheets / Excel (เมนูนำเข้าใน /patients)
- [ ] เพิ่มรายการยาในคลังให้ครบ (เมนู /medications)
- [ ] ทดสอบเข้าจากทุกอุปกรณ์ที่ครู/พี่เลี้ยงใช้งานจริง
- [ ] เปิด HTTPS ทั้ง frontend และ backend (Vercel/Render เปิดให้อัตโนมัติ)
