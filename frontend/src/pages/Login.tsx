import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import Brand from "../components/layout/Brand";
import { login } from "../services/authService";
import { useAppDispatch, useAppSelector } from "../store";
import { setUser } from "../store/authSlice";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    navigate("/", { replace: true });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await login(username.trim(), password);
      dispatch(setUser(res.user));
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ksp-blue-800 via-ksp-blue-700 to-ksp-blue-500 px-4 py-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-ksp-accent/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:flex flex-col text-white pr-4">
          <Brand variant="white" size="lg" withTagline />
          <h2 className="mt-8 text-3xl font-bold leading-snug">
            บริหารจัดการเรือนพยาบาล
            <br />
            อย่างเป็นระบบ ทันสมัย ปลอดภัย
          </h2>
          <p className="mt-4 text-white/85 leading-relaxed">
            ระบบบันทึก ติดตาม และวิเคราะห์การเข้ารับบริการเรือนพยาบาลของโรงเรียน
            กาฬสินธุ์ปัญญานุกูล สำหรับครูเรือนพยาบาลและพี่เลี้ยง ใช้งานได้ทุกอุปกรณ์
            ผ่านเว็บเบราว์เซอร์
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/85">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-ksp-accent" />
              ค้นหานักเรียน + ดูประวัติสุขภาพได้ใน 2 คลิก
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-ksp-accent" />
              บันทึก OPD / Admission / Referral ครบในที่เดียว
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-ksp-accent" />
              สรุปรายงาน + ส่งออก PDF อัตโนมัติ
            </li>
          </ul>
        </div>

        <div className="card-pad shadow-2xl bg-white/95 backdrop-blur">
          <div className="md:hidden mb-4 flex justify-center">
            <Brand variant="color" size="md" withTagline />
          </div>
          <h1 className="text-xl font-bold text-ksp-navy">เข้าสู่ระบบ</h1>
          <p className="text-sm text-ksp-gray mt-1">
            กรุณากรอกชื่อผู้ใช้และรหัสผ่านที่ได้รับจากครูเรือนพยาบาล
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="username">
                ชื่อผู้ใช้
              </label>
              <input
                id="username"
                className="input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="เช่น admin"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  id="password"
                  className="input pr-10"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-2 my-auto h-8 w-8 grid place-items-center rounded-lg text-ksp-gray hover:bg-ksp-blue-50"
                  aria-label="แสดง/ซ่อนรหัสผ่าน"
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <div className="mt-6 text-xs text-ksp-gray text-center">
            หากลืมรหัสผ่าน กรุณาติดต่อครูเรือนพยาบาล (Admin) เพื่อรีเซ็ตให้ใหม่
          </div>
        </div>
      </div>
    </div>
  );
}
