import { useState, type FormEvent } from "react";
import { Settings as SettingsIcon, KeyRound, Info } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { useToast } from "../../components/common/useToast";
import { useAppSelector } from "../../store";
import { changeMyPassword } from "../../services/usersService";

export default function AdminSettingsPage() {
  const toast = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
