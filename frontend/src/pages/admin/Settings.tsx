import { useEffect, useState, type FormEvent } from "react";
import { Settings as SettingsIcon, KeyRound, Info, Database, Users, Circle } from "lucide-react";
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

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
    </>
  );
}
