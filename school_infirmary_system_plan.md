# ระบบบริหารจัดการเรือนพยาบาลออนไลน์ — โรงเรียนกาฬสินธุ์ปัญญานุกูล
## System Architecture & Codex Implementation Plan (GPT-5.5)

---

## 1. ภาพรวมสถาปัตยกรรมระบบ (System Architecture Overview)

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (PWA)                        │
│          React + TypeScript + Tailwind CSS                   │
│     Service Worker (Offline Support) + IndexedDB Cache       │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API / GraphQL
┌────────────────────────▼────────────────────────────────────┐
│                     BACKEND (Node.js)                        │
│               Express.js + Prisma ORM                        │
│         JWT Auth │ Role-Based Access Control (RBAC)          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    DATABASE LAYER                            │
│          PostgreSQL (Primary) + SQLite (Offline Fallback)    │
│              Sync Queue for Offline→Online Merge             │
└─────────────────────────────────────────────────────────────┘
```

### เทคโนโลยีหลัก

| Layer | Technology | เหตุผล |
|-------|-----------|--------|
| Frontend | React 18 + TypeScript | Component-based, Type-safe |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI, accessible |
| Offline Storage | IndexedDB (Dexie.js) | Browser-native offline DB |
| Service Worker | Workbox | Cache-first strategy |
| Backend | Node.js + Express.js | Lightweight, scalable |
| ORM | Prisma | Type-safe DB queries |
| Database | PostgreSQL + SQLite | Online + Offline fallback |
| Auth | JWT + bcrypt | Secure, stateless |
| PDF Export | jsPDF + html2pdf | Client-side PDF generation |
| Charts | Chart.js / Recharts | Statistics visualization |
| Sync | Background Sync API | Offline→Online data merge |

---

## 2. โครงสร้างฐานข้อมูล (Database Schema)

### 2.1 ตาราง Users (ผู้ใช้งาน)
```sql
Table: users
- id            UUID        PRIMARY KEY
- username      VARCHAR(50) UNIQUE NOT NULL
- password_hash VARCHAR     NOT NULL
- full_name     VARCHAR(100)
- role          ENUM('admin', 'nurse_assistant')
- is_active     BOOLEAN     DEFAULT true
- created_at    TIMESTAMP
- updated_at    TIMESTAMP
```

### 2.2 ตาราง Students (ข้อมูลนักเรียน)
```sql
Table: students
- id              UUID        PRIMARY KEY
- student_id      VARCHAR(20) UNIQUE      -- รหัสนักเรียน
- first_name      VARCHAR(100)
- last_name       VARCHAR(100)
- class_room      VARCHAR(20)             -- ชั้นเรียน
- dormitory       VARCHAR(50)             -- เรือนนอน
- homeroom_teacher VARCHAR(100)           -- ครูประจำชั้น
- blood_type      ENUM('A','B','AB','O')
- congenital_disease TEXT                 -- โรคประจำตัว
- drug_allergy    TEXT                    -- การแพ้ยา
- regular_medication TEXT                 -- ยาประจำตัว
- parent_name     VARCHAR(100)
- parent_phone    VARCHAR(20)
- is_active       BOOLEAN     DEFAULT true
- created_at      TIMESTAMP
- updated_at      TIMESTAMP
```

### 2.3 ตาราง OPD_Visits (บันทึกการเข้าใช้บริการ OPD)
```sql
Table: opd_visits
- id              UUID        PRIMARY KEY
- student_id      UUID        FK → students.id
- visit_date      DATE
- visit_time      TIME
- chief_complaint TEXT        -- อาการที่มา
- diagnosis       TEXT        -- การวินิจฉัย
- treatment       TEXT        -- การรักษา
- medications     JSONB       -- ยาที่ได้รับ [{drug_id, drug_name, dose, qty}]
- recorded_by     UUID        FK → users.id
- created_at      TIMESTAMP
- sync_status     ENUM('synced','pending') DEFAULT 'synced'  -- สำหรับ offline
- local_id        VARCHAR     -- ID ชั่วคราวตอน offline
```

### 2.4 ตาราง Admissions (บันทึกการนอนพักรักษาตัว)
```sql
Table: admissions
- id              UUID        PRIMARY KEY
- student_id      UUID        FK → students.id
- admit_date      DATE
- admit_time      TIME
- chief_complaint TEXT
- discharge_date  DATE        NULLABLE
- discharge_destination ENUM('dormitory','home','hospital') NULLABLE
- total_days      INT         -- คำนวณอัตโนมัติ
- notes           TEXT
- recorded_by     UUID        FK → users.id
- created_at      TIMESTAMP
- sync_status     ENUM('synced','pending') DEFAULT 'synced'
```

### 2.5 ตาราง Referrals (บันทึกการส่งต่อโรงพยาบาล)
```sql
Table: referrals
- id              UUID        PRIMARY KEY
- student_id      UUID        FK → students.id
- referral_date   DATE
- referral_time   TIME
- chief_complaint TEXT
- referred_to     VARCHAR(200)  -- ชื่อโรงพยาบาล
- treatment_given TEXT
- recorded_by     UUID        FK → users.id
- created_at      TIMESTAMP
- sync_status     ENUM('synced','pending') DEFAULT 'synced'
```

### 2.6 ตาราง Medications (คลังยา)
```sql
Table: medications
- id              UUID        PRIMARY KEY
- drug_code       VARCHAR(20) UNIQUE
- drug_name       VARCHAR(200)
- drug_type       VARCHAR(50)   -- ประเภทยา
- unit            VARCHAR(20)   -- หน่วย (เม็ด, ขวด, ซอง)
- stock_qty       INT
- min_stock       INT           -- แจ้งเตือนเมื่อต่ำกว่า
- is_active       BOOLEAN     DEFAULT true
```

### 2.7 ตาราง PM25_Records (ข้อมูล PM 2.5)
```sql
Table: pm25_records
- id              UUID        PRIMARY KEY
- record_date     DATE
- record_time     TIME
- pm25_value      DECIMAL(6,2)
- aqi_level       ENUM('good','moderate','unhealthy_sensitive','unhealthy','very_unhealthy','hazardous')
- notes           TEXT
- recorded_by     UUID        FK → users.id
- created_at      TIMESTAMP
```

### 2.8 ตาราง Sync_Queue (คิวข้อมูล Offline)
```sql
Table: sync_queue
- id              UUID        PRIMARY KEY
- table_name      VARCHAR(50)
- operation       ENUM('INSERT','UPDATE','DELETE')
- record_id       VARCHAR     -- local_id หรือ UUID
- payload         JSONB       -- ข้อมูลที่ต้องการ sync
- created_at      TIMESTAMP
- synced_at       TIMESTAMP   NULLABLE
- retry_count     INT         DEFAULT 0
```

---

## 3. โครงสร้างโปรเจกต์ (Project Structure)

```
infirmary-system/
├── frontend/
│   ├── public/
│   │   ├── manifest.json             # PWA manifest
│   │   └── service-worker.js         # Workbox SW
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── OfflineBanner.tsx  # แสดงเมื่อ offline
│   │   │   ├── patients/
│   │   │   │   ├── PatientForm.tsx
│   │   │   │   ├── PatientSearch.tsx
│   │   │   │   └── PatientCard.tsx
│   │   │   ├── visits/
│   │   │   │   ├── OPDForm.tsx
│   │   │   │   ├── AdmissionForm.tsx
│   │   │   │   └── ReferralForm.tsx
│   │   │   ├── reports/
│   │   │   │   ├── DailyReport.tsx
│   │   │   │   ├── MonthlyReport.tsx
│   │   │   │   └── StatisticsCharts.tsx
│   │   │   └── common/
│   │   │       ├── PDFExportButton.tsx
│   │   │       └── SyncStatusIndicator.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PatientList.tsx
│   │   │   ├── PatientProfile.tsx
│   │   │   ├── OPDRecord.tsx
│   │   │   ├── Admissions.tsx
│   │   │   ├── Referrals.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── PM25.tsx
│   │   │   ├── MedicationStock.tsx
│   │   │   └── Settings.tsx (Admin only)
│   │   ├── hooks/
│   │   │   ├── useOfflineSync.ts
│   │   │   ├── useIndexedDB.ts
│   │   │   └── useNetworkStatus.ts
│   │   ├── services/
│   │   │   ├── api.ts                # Axios instance
│   │   │   ├── offlineDB.ts          # Dexie.js setup
│   │   │   ├── syncService.ts        # Offline→Online sync logic
│   │   │   └── pdfService.ts         # PDF generation
│   │   ├── store/
│   │   │   ├── authSlice.ts
│   │   │   └── syncSlice.ts
│   │   └── types/
│   │       └── index.ts
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── patients.routes.ts
│   │   │   ├── visits.routes.ts
│   │   │   ├── admissions.routes.ts
│   │   │   ├── referrals.routes.ts
│   │   │   ├── medications.routes.ts
│   │   │   ├── reports.routes.ts
│   │   │   └── sync.routes.ts
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # JWT verify
│   │   │   └── rbac.middleware.ts    # Role check
│   │   ├── services/
│   │   │   └── syncService.ts       # Merge conflict resolution
│   │   └── prisma/
│   │       └── schema.prisma
│   └── package.json
└── docker-compose.yml
```

---

## 4. ฟีเจอร์ Offline-First (การทำงานแบบออฟไลน์)

### แนวทางการออกแบบ

```
[ผู้ใช้บันทึกข้อมูล]
        │
        ▼
[ตรวจสอบสถานะเครือข่าย]
   Online? ──YES──► [บันทึกไปยัง API + IndexedDB]
      │
      NO
      ▼
[บันทึกลง IndexedDB พร้อม local_id]
[เพิ่มเข้า Sync Queue]
[แสดง "บันทึกแบบออฟไลน์ - รอ sync"]
        │
[เมื่อกลับมา Online]
        │
        ▼
[Background Sync ทำงาน]
[ส่งข้อมูลใน Queue ไปยัง API]
[อัปเดต sync_status = 'synced']
[แสดงแจ้งเตือน "ซิงค์ข้อมูลสำเร็จ"]
```

### ข้อมูลที่ Cache ไว้ Offline
- รายชื่อนักเรียนทั้งหมด (read-only cache)
- รายการยาในคลัง
- ข้อมูลสุขภาพพื้นฐานนักเรียน
- ฟอร์มบันทึก OPD, Admission, Referral (write queue)

---

## 5. API Endpoints

### Authentication
```
POST   /api/auth/login              -- เข้าสู่ระบบ
POST   /api/auth/logout             -- ออกจากระบบ
POST   /api/auth/refresh-token      -- refresh JWT
```

### Students
```
GET    /api/students                -- รายชื่อนักเรียนทั้งหมด
POST   /api/students                -- เพิ่มนักเรียน (Admin)
GET    /api/students/:id            -- ข้อมูลนักเรียนรายคน + ประวัติ
PUT    /api/students/:id            -- แก้ไขข้อมูล (Admin)
DELETE /api/students/:id            -- ปิดการใช้งาน (Admin)
GET    /api/students/search?q=...   -- ค้นหาด่วน
```

### OPD Visits
```
GET    /api/visits                  -- รายการเข้าใช้บริการ
POST   /api/visits                  -- บันทึกการเข้าใช้บริการ
GET    /api/visits/:id              -- รายละเอียด
PUT    /api/visits/:id              -- แก้ไข
GET    /api/visits/student/:studentId -- ประวัติรายบุคคล
```

### Admissions
```
GET    /api/admissions              -- รายการนอนพัก
POST   /api/admissions              -- บันทึก admit
PUT    /api/admissions/:id/discharge -- บันทึก discharge
GET    /api/admissions/active       -- ผู้ป่วยที่ยังนอนพักอยู่
```

### Referrals
```
GET    /api/referrals               -- รายการส่งต่อ
POST   /api/referrals               -- บันทึกการส่งต่อ
GET    /api/referrals/summary       -- สรุปการส่งต่อ
```

### Reports
```
GET    /api/reports/daily?date=...       -- รายงานประจำวัน
GET    /api/reports/monthly?month=...    -- รายงานประจำเดือน
GET    /api/reports/yearly?year=...      -- รายงานประจำปี
GET    /api/reports/common-symptoms      -- อาการที่พบบ่อย
GET    /api/reports/by-class             -- แยกตามชั้นเรียน
GET    /api/reports/statistics           -- ข้อมูลกราฟ/แผนภูมิ
```

### Sync
```
POST   /api/sync/push               -- ส่งข้อมูล offline queue
GET    /api/sync/status             -- ตรวจสอบ sync status
```

### PM2.5
```
GET    /api/pm25                    -- ประวัติค่า PM 2.5
POST   /api/pm25                    -- บันทึกค่าใหม่
```

---

## 6. แผนการดำเนินการ (Implementation Phases)

### Phase 1: Foundation (สัปดาห์ที่ 1–2)
**เป้าหมาย:** ตั้งโครงสร้างโปรเจกต์, ระบบ Auth, โครงสร้างฐานข้อมูล

**Prompt สำหรับ Codex:**
```
Create a Node.js + Express + TypeScript backend with:
1. Prisma ORM connected to PostgreSQL
2. JWT authentication with refresh tokens
3. Role-based access control (admin, nurse_assistant)
4. User model with roles as described in schema
5. Login/logout/refresh endpoints
6. Middleware for JWT verification and role checking

Create a React 18 + TypeScript frontend with:
1. Vite build tool
2. Tailwind CSS + shadcn/ui components
3. React Router v6 with protected routes
4. Redux Toolkit for state management
5. Axios for API calls with interceptors
6. Login page with form validation
```

---

### Phase 2: Patient Management (สัปดาห์ที่ 3–4)
**เป้าหมาย:** CRUD นักเรียน, ค้นหา, ประวัติสุขภาพ

**Prompt สำหรับ Codex:**
```
Build patient management module:
1. Student CRUD API endpoints (backend)
2. Student list page with search/filter by name, class, dormitory
3. Student profile page showing:
   - Basic info (name, class, dormitory, homeroom teacher)
   - Health info (blood type, congenital disease, drug allergy, regular medications)
   - Visit history timeline
4. Add/Edit student form with validation
5. Import students from CSV/Excel file (Admin only)
6. Quick search component with keyboard shortcut (Ctrl+K)
```

---

### Phase 3: Visit Recording (สัปดาห์ที่ 5–6)
**เป้าหมาย:** บันทึก OPD, Admission, Referral

**Prompt สำหรับ Codex:**
```
Build visit recording module with these forms:

1. OPD Form (outpatient visit):
   Fields: student (autocomplete), date, time, chief complaint, 
   diagnosis, treatment, medications (multi-select with dosage), 
   recorded by (auto-filled from logged-in user)

2. Admission Form (inpatient):
   Fields: student, admit date/time, chief complaint, 
   discharge date/time (nullable), discharge destination 
   (enum: dormitory/home/hospital), auto-calculate total days

3. Referral Form:
   Fields: student, date/time, chief complaint, 
   hospital name (referred to), treatment given

4. Active admissions dashboard showing current inpatients
5. Recent visits list with pagination
```

---

### Phase 4: Offline Support (สัปดาห์ที่ 7–8)
**เป้าหมาย:** PWA, IndexedDB, Service Worker, Sync Queue

**Prompt สำหรับ Codex:**
```
Implement offline-first functionality:

1. Set up Dexie.js (IndexedDB wrapper) with tables matching the database schema
2. Create useNetworkStatus hook to detect online/offline state
3. Create OfflineBanner component shown when offline
4. Modify all forms to:
   - Save to IndexedDB first (always)
   - If online: immediately sync to API
   - If offline: add to sync_queue table in IndexedDB with 'pending' status
   - Show "Saved offline" notification when offline

5. Create syncService.ts:
   - Check sync_queue on app load and network reconnect
   - Send pending records to API in order
   - Handle conflict resolution (last-write-wins with timestamp)
   - Update sync_status after successful sync

6. Configure Workbox service worker:
   - Cache static assets (cache-first)
   - Cache student list API (stale-while-revalidate, 24h)
   - Cache medications list API (stale-while-revalidate, 1h)
   - Background sync for POST/PUT requests

7. Add PWA manifest.json for installability
8. Show sync status indicator in navbar (pending count)
```

---

### Phase 5: Reports & Statistics (สัปดาห์ที่ 9–10)
**เป้าหมาย:** รายงาน, กราฟ, Export PDF

**Prompt สำหรับ Codex:**
```
Build reporting module:

1. Daily Report page:
   - Summary table of all visits for selected date
   - Filter by type (OPD / Admission / Referral)
   - Print-friendly layout

2. Monthly Report page:
   - Visit count by day (bar chart)
   - Top 10 most common symptoms (horizontal bar chart)
   - Breakdown by class/dormitory (table)

3. Annual Statistics page:
   - Monthly visit trend (line chart)
   - Pie chart: OPD vs Admission vs Referral
   - Hospital referral summary

4. PDF Export:
   - "Export PDF" button on all report pages
   - Use jsPDF + html2pdf
   - Include school logo header
   - Include date range and generated timestamp
   - Save as: "รายงาน_เรือนพยาบาล_[date].pdf"

Use Recharts or Chart.js for all visualizations.
```

---

### Phase 6: PM2.5 & Medication Stock (สัปดาห์ที่ 11)
**เป้าหมาย:** บันทึก PM 2.5, จัดการคลังยา

**Prompt สำหรับ Codex:**
```
Build PM2.5 and medication modules:

1. PM2.5 module:
   - Form to record daily PM2.5 value with AQI classification
   - AQI color indicator (green/yellow/orange/red/purple/maroon)
   - Historical chart (last 30 days)
   - Alert when value exceeds safe threshold (>50 µg/m³)

2. Medication stock module:
   - Medications list with current stock
   - Low stock alert (highlight items below minimum)
   - Drug lookup autocomplete for OPD form
   - Stock adjustment form (add/subtract with reason)
```

---

### Phase 7: Admin Panel & Polish (สัปดาห์ที่ 12)
**เป้าหมาย:** User management, Settings, Final testing

**Prompt สำหรับ Codex:**
```
Build admin panel and finish the system:

1. User Management (Admin only):
   - List all users with role and status
   - Create/edit/deactivate user accounts
   - Force password reset

2. System Settings:
   - School name and logo upload
   - Dormitory list configuration
   - Class list configuration

3. Audit Log:
   - Record all create/edit/delete actions
   - Viewable by admin only

4. Final polish:
   - Responsive design for tablet (1024px) and mobile (375px)
   - Loading skeletons for all data tables
   - Error boundary components
   - Toast notifications for all actions
   - Confirm dialog for destructive actions
```

---

## 7. โครงสร้าง Prompt สำหรับ Codex (Prompt Template)

### Template มาตรฐานสำหรับแต่ละ Feature

```markdown
## Context
You are building an infirmary management system for a Thai special education school.
The system is a PWA (Progressive Web App) using:
- Frontend: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Node.js + Express + TypeScript + Prisma + PostgreSQL
- Offline support: Dexie.js (IndexedDB) + Workbox Service Worker

## Current State
[อธิบายสิ่งที่สร้างไปแล้ว]

## Task
[อธิบาย feature ที่ต้องการสร้าง]

## Requirements
1. [Requirement 1]
2. [Requirement 2]
...

## Expected Output
- File: [ชื่อไฟล์ที่ต้องการ]
- Tests: [specify if tests are needed]
- Must follow existing code style and patterns

## Constraints
- All text/labels must support Thai language (UTF-8)
- Forms must work offline (save to IndexedDB first)
- Must include TypeScript types for all props and API responses
- Error handling required for all async operations
```

---

## 8. Environment & Deployment

### Development Setup
```bash
# Clone and install
git clone <repo>
cd infirmary-system
npm install

# Backend setup
cd backend
cp .env.example .env
# Edit DATABASE_URL, JWT_SECRET
npx prisma migrate dev
npm run dev

# Frontend setup
cd ../frontend
cp .env.example .env
# Edit VITE_API_URL
npm run dev
```

### Environment Variables
```env
# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/infirmary_db
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001

# Frontend (.env)
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=ระบบเรือนพยาบาล
```

### Production Deployment Options

| Option | เหมาะสำหรับ | ค่าใช้จ่าย |
|--------|------------|-----------|
| Railway.app | ง่าย, all-in-one | ~$5/เดือน |
| VPS (DigitalOcean/Vultr) | ควบคุมได้เต็มที่ | ~$6/เดือน |
| โรงเรียน on-premise | ไม่มีค่า hosting | ต้องการ server |
| Render.com | Free tier ได้ | Free (sleep 15 min) |

---

## 9. ลำดับความสำคัญ (Priority Checklist)

### Must Have (P0)
- [x] ระบบ Login / Auth
- [x] บันทึกการเข้าใช้บริการ OPD
- [x] บันทึก Admission / Referral
- [x] ค้นหานักเรียนด่วน
- [x] ทำงาน Offline ได้
- [x] Export PDF

### Should Have (P1)
- [x] รายงานรายวัน/เดือน/ปี
- [x] กราฟสถิติ
- [x] บันทึก PM 2.5
- [x] ประวัติสุขภาพนักเรียน

### Nice to Have (P2)
- [ ] แจ้งเตือน Line Notify
- [ ] นำเข้าข้อมูลจาก Google Sheets
- [ ] Dark mode
- [ ] Multi-language (TH/EN)

---

## 10. หมายเหตุสำคัญสำหรับ Codex

1. **Offline-first:** ทุก write operation ต้องบันทึกลง IndexedDB ก่อนเสมอ แม้จะ online
2. **Thai text:** ทุก label/placeholder/error message ต้องเป็นภาษาไทย
3. **Data migration:** ควรมี script นำเข้าข้อมูลจาก Google Sheets ที่มีอยู่เดิม
4. **Conflict resolution:** เมื่อ sync offline data ให้ใช้ `updated_at` timestamp เป็น tiebreaker
5. **Security:** ไม่ log ข้อมูลผู้ป่วยลง console, hash password ด้วย bcrypt (salt rounds: 12)
6. **Performance:** Paginate รายการที่มี >50 records, lazy load ประวัติย้อนหลัง
```

---

*เอกสารนี้จัดทำสำหรับการสั่งงาน Codex (GPT-5.5) เพื่อพัฒนาระบบบริหารจัดการเรือนพยาบาล โรงเรียนกาฬสินธุ์ปัญญานุกูล*  
*สร้างเมื่อ: พฤษภาคม 2569*
