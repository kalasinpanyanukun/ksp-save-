import { useEffect, useState, type FormEvent } from "react";
import {
  Settings as SettingsIcon,
  KeyRound,
  Info,
  Database,
  Users,
  Circle,
  HardDrive,
  Code2,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { useToast } from "../../components/common/useToast";
import { useAppSelector } from "../../store";
import { changeMyPassword } from "../../services/usersService";
import { getSystemStatus, type SystemStatus } from "../../services/systemService";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "ครูเรือนพยาบาล (Admin)",
  nurse_assistant: "พี่เลี้ยงเรือนพยาบาล",
};

const TECH_STACK = [
  ["Frontend", "React 18, TypeScript, Vite, Tailwind CSS, Redux Toolkit, Axios, Lucide React, jsPDF"],
  ["Backend", "Node.js, Express, TypeScript, Prisma ORM, Zod validation, JWT auth, bcryptjs"],
  ["Database", "Supabase PostgreSQL ผ่าน Prisma schema และ migrations ใน backend/prisma"],
  ["File Storage", "Supabase Storage bucket: student-photos สำหรับรูปนักเรียนเท่านั้น"],
  ["Deploy", "GitHub เป็น source control, Vercel สำหรับ production hosting/API"],
  ["Auth/Roles", "super_admin, admin, nurse_assistant พร้อม ProtectedRoute และ RBAC ฝั่ง API"],
  ["API Base", "Frontend ใช้ VITE_API_URL ค่าเริ่มต้น /api และ backend route หลักอยู่ที่ /api/*"],
];

function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาทีที่แล้ว`;
  return new Date(iso).toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminSettingsPage() {
  const toast = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    let alive = true;
    const fetchStatus = () => {
      getSystemStatus()
        .then((s) => alive && setStatus(s))
        .catch(() => {});
    };
    fetchStatus();
    const t = setInterval(fetchStatus, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast("รหัสผ่านใหม่ไม่ตรงกัน", "error");
      return;
    }
    setSubmitting(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      toast("เปลี่ยนรหัสผ่านเรียบร้อย", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const m =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "เปลี่ยนรหัสผ่านไม่สำเร็จ";
      toast(m, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="ตั้งค่าระบบ"
        description="ข้อมูลโรงเรียน บัญชีผู้ใช้ และการตั้งค่าทั่วไป"
      />

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* การใช้งานฐานข้อมูล Supabase */}
        <div className="card-pad">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ksp-navy">
            <Database className="h-4 w-4 text-ksp-blue-600" /> การใช้งานฐานข้อมูล (Supabase)
          </h2>
          {!status ? (
            <p className="text-sm text-ksp-gray">กำลังโหลด…</p>
          ) : (
            <>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-ksp-navy">
                  {formatBytes(status.database.usedBytes)}
                </span>
                <span className="text-sm text-ksp-gray">
                  จาก {status.database.limitMb >= 1024 ? `${(status.database.limitMb / 1024).toFixed(0)} GB` : `${status.database.limitMb} MB`}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    status.database.usedPct >= 90
                      ? "bg-rose-500"
                      : status.database.usedPct >= 70
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.max(2, status.database.usedPct)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-ksp-gray">
                <span>ใช้ไป {status.database.usedPct.toFixed(1)}%</span>
                <span>
                  เหลือ {formatBytes(Math.max(0, status.database.totalBytes - status.database.usedBytes))}
                </span>
              </div>
            </>
          )}
        </div>

        {/* การใช้พื้นที่รูปนักเรียน */}
        <div className="card-pad">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ksp-navy">
            <HardDrive className="h-4 w-4 text-ksp-blue-600" /> การใช้พื้นที่รูปนักเรียน
          </h2>
          {!status ? (
            <p className="text-sm text-ksp-gray">กำลังโหลด…</p>
          ) : (
            <>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-ksp-navy">
                  {formatBytes(status.fileStorage.usedBytes)}
                </span>
                <span className="text-sm text-ksp-gray">
                  จาก {status.fileStorage.limitGb.toFixed(1)} GB
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    status.fileStorage.usedPct >= 90
                      ? "bg-rose-500"
                      : status.fileStorage.usedPct >= 70
                        ? "bg-amber-500"
                        : "bg-ksp-blue-500"
                  }`}
                  style={{ width: `${Math.max(2, status.fileStorage.usedPct)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-ksp-gray">
                <span>ใช้ไป {status.fileStorage.usedPct.toFixed(1)}%</span>
                <span>
                  เหลือ {formatBytes(Math.max(0, status.fileStorage.totalBytes - status.fileStorage.usedBytes))}
                </span>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                <p className="text-ksp-gray">ใช้กับรูปนักเรียน</p>
                <p className="mt-1 font-semibold text-ksp-navy">
                  {formatBytes(status.fileStorage.studentPhotoBytes)}
                </p>
              </div>
              <p className="mt-3 text-[11px] text-ksp-gray">
                แผนพื้นที่นี้ตั้งไว้ 1 GB: รูปนักเรียน 500 คน × 2 MB = 1,000 MB โดยประมาณ
              </p>
              <p className="mt-1 text-[11px] text-amber-700">
                หมายเหตุ: เมนูเอกสารถูกถอดออกแล้วเพื่อกันพื้นที่ให้รูปนักเรียนใน Supabase Free plan
              </p>
            </>
          )}
        </div>

        {/* บัญชีที่กำลังใช้งาน */}
        <div className="card-pad">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-ksp-navy">
            <Users className="h-4 w-4 text-ksp-blue-600" /> บัญชีที่กำลังใช้งาน
            {status && (
              <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {status.activeUsers.length} ออนไลน์
              </span>
            )}
          </h2>
          {!status || status.activeUsers.length === 0 ? (
            <p className="text-sm text-ksp-gray">ไม่มีบัญชีที่ใช้งานอยู่ในขณะนี้</p>
          ) : (
            <ul className="space-y-2">
              {status.activeUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
                  <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ksp-navy">{u.fullName}</p>
                    <p className="truncate text-xs text-ksp-gray">
                      {ROLE_LABEL[u.role] ?? u.role} · {u.username}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-ksp-gray">{timeAgo(u.lastSeenAt)}</span>
                </li>
              ))}
            </ul>
          )}
          {status && (
            <p className="mt-3 text-[11px] text-ksp-gray">
              * นับจากกิจกรรมภายใน {status.activeWindowMin} นาทีล่าสุด
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-pad">
          <h2 className="text-base font-semibold text-ksp-navy mb-3 flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" /> ข้อมูลโรงเรียน
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-ksp-gray">ชื่อโรงเรียน</dt>
              <dd className="font-medium text-right">
                โรงเรียนกาฬสินธุ์ปัญญานุกูล
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ksp-gray">ชื่อระบบ</dt>
              <dd className="font-medium">
                KSP SAVE+ · เรือนพยาบาลออนไลน์
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ksp-gray">เวอร์ชัน</dt>
              <dd className="font-mono text-xs">v0.1.0</dd>
            </div>
          </dl>
          <div className="mt-4 flex gap-2 items-start text-xs text-ksp-gray rounded-xl bg-ksp-blue-50 px-3 py-2.5">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-ksp-blue-500" />
            การแก้ไขชื่อโรงเรียนและโลโก้ในเวอร์ชันถัดไปจะใช้ตาราง settings (ขณะนี้กำหนดในโค้ดและไฟล์ public/logo.svg)
          </div>
        </div>

        <div className="card-pad">
          <h2 className="text-base font-semibold text-ksp-navy mb-3 flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> เปลี่ยนรหัสผ่านของคุณ
          </h2>
          <p className="text-sm text-ksp-gray mb-3">
            ผู้ใช้: <strong>{user?.fullName}</strong> ({user?.username})
          </p>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="label">รหัสผ่านปัจจุบัน *</label>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">รหัสผ่านใหม่ *</label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="label">ยืนยันรหัสผ่านใหม่ *</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={submitting}
            >
              {submitting ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4 card-pad">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ksp-navy">
          <Code2 className="h-4 w-4 text-ksp-blue-600" /> ข้อมูลส่วนสำหรับนักพัฒนา
        </h2>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <dl className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {TECH_STACK.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                  <dt className="text-xs font-semibold text-ksp-gray">{label}</dt>
                  <dd className="mt-1 text-sm font-medium leading-6 text-ksp-navy">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-2xl border border-ksp-blue-100 bg-ksp-blue-50/60 p-4">
            <h3 className="font-semibold text-ksp-navy">บัญชีและสภาพแวดล้อม</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ksp-gray">อีเมลโปรเจกต์</dt>
                <dd className="text-right font-semibold text-ksp-navy">
                  kalasinpanyanukun@ksp.ac.th
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ksp-gray">รหัสผ่าน</dt>
                <dd className="text-right font-semibold text-ksp-navy">(ติดต่อฝ่าย IT)</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ksp-gray">Production domain</dt>
                <dd className="text-right font-semibold text-ksp-navy">save.ksp.ac.th</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ksp-gray">Storage limit ภายในระบบ</dt>
                <dd className="text-right font-semibold text-ksp-navy">1 GB</dd>
              </div>
            </dl>
            <div className="mt-4 flex gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs leading-5 text-ksp-gray">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-ksp-blue-500" />
              เมื่อเพิ่ม environment ใหม่ให้ตั้งค่า DATABASE_URL, DIRECT_URL, JWT secrets, SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY ก่อน deploy
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
