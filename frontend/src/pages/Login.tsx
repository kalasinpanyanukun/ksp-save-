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
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-gradient-to-br from-ksp-blue-800 via-ksp-blue-700 to-ksp-blue-500 px-4 py-5 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.12),transparent_34%),radial-gradient(circle_at_82%_78%,rgba(95,198,235,0.28),transparent_32%)]" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 items-center justify-center py-3 sm:py-5">
        <div className="grid w-full grid-cols-1 items-center gap-8 md:grid-cols-[1fr_22rem] lg:gap-16">
          <section className="hidden text-white md:block">
            <Brand
              variant="white"
              size="xxl"
              withTagline
              className="origin-left"
            />
            <h1 className="mt-8 max-w-3xl text-[1.8rem] font-extrabold leading-tight tracking-normal lg:text-[2.25rem]">
              ระบบบริหารจัดการเรือนพยาบาล
              <br />
              โรงเรียนกาฬสินธุ์ปัญญานุกูล จังหวัดกาฬสินธุ์
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/86">
              ระบบสำหรับบันทึก ติดตาม และดูแลข้อมูลสุขภาพนักเรียน
              <br />
              และติดตามสถานะคลังยา / เวชภัณฑ์ รวมถึงงานพยาบาลอื่น ๆ
            </p>
          </section>

          <div className="flex flex-col items-center gap-7">
            <div className="flex justify-center md:hidden">
              <Brand variant="white" size="lg" withTagline />
            </div>
            <section className="mx-auto flex min-h-[30rem] w-full max-w-[22rem] flex-col justify-center rounded-lg border border-white/45 bg-white/95 px-6 py-9 shadow-2xl backdrop-blur md:min-h-[33rem] md:px-7">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-ksp-navy">เข้าสู่ระบบ</h2>
              <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-6 text-ksp-gray">
                กรุณากรอกชื่อผู้ใช้และรหัสผ่าน
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
                    className="absolute inset-y-0 right-2 my-auto grid h-8 w-8 place-items-center rounded-lg text-ksp-gray hover:bg-ksp-blue-50"
                    aria-label="แสดงหรือซ่อนรหัสผ่าน"
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
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
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

            <p className="mt-6 text-center text-xs leading-5 text-ksp-gray">
              พบปัญหาการใช้งานติดต่อ
              <br />
              ครูธนิทฯ โทร 0964969369
            </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="relative mx-auto w-full max-w-4xl shrink-0 pb-1 text-center text-xs font-medium leading-6 text-white drop-shadow">
        <div>KSP SAVE+ V 0.1.0</div>
        <div>พัฒนาโดย ครูธนิท ธนพัตนิรัชกุล</div>
      </footer>
    </div>
  );
}
