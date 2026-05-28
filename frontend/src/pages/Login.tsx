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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-ksp-blue-800 via-ksp-blue-700 to-ksp-blue-500 px-4 py-10">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.12),transparent_34%),radial-gradient(circle_at_82%_78%,rgba(95,198,235,0.28),transparent_32%)]" />

      <main className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full grid-cols-1 items-center gap-10 md:grid-cols-[1fr_22rem] lg:gap-16">
          <section className="hidden text-white md:block">
            <Brand
              variant="white"
              size="xl"
              withTagline
              className="scale-95 origin-left"
            />
            <h1 className="mt-10 max-w-3xl text-4xl font-extrabold leading-tight tracking-normal lg:text-5xl">
              บริหารจัดการเรือนพยาบาล โรงเรียนกาฬสินธุ์ปัญญานุกูล
              จังหวัดกาฬสินธุ์ อย่างเป็นระบบ ทันสมัย ปลอดภัย
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/86">
              ระบบงานเรือนพยาบาลสำหรับบันทึก ติดตาม และดูแลข้อมูลสุขภาพนักเรียน
              ด้วยหน้าจอที่เป็นทางการ ใช้งานง่าย และรองรับงานประจำวันของโรงเรียน
            </p>
          </section>

          <section className="mx-auto flex min-h-[33rem] w-full max-w-[22rem] flex-col justify-center rounded-lg border border-white/45 bg-white/95 px-6 py-9 shadow-2xl backdrop-blur md:px-7">
            <div className="mb-7 flex justify-center md:hidden">
              <Brand variant="color" size="lg" withTagline />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-ksp-navy">เข้าสู่ระบบ</h2>
              <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-6 text-ksp-gray">
                กรุณากรอกชื่อผู้ใช้และรหัสผ่านที่ได้รับจากครูเรือนพยาบาล
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
              หากลืมรหัสผ่าน กรุณาติดต่อครูเรือนพยาบาลเพื่อรีเซ็ตให้ใหม่
            </p>
          </section>
        </div>
      </main>

      <footer className="relative mx-auto mt-4 max-w-4xl text-center text-xs font-medium leading-6 text-white/88 drop-shadow">
        <div>KSP SAVE+ V 0.1.0</div>
        <div>โรงเรียนกาฬสินธุ์ปัญญานุกูล จังหวัดกาฬสินธุ์</div>
        <div>พัฒนาโดย ครูธนิท ธนพัตนิรัชกุล</div>
      </footer>
    </div>
  );
}
