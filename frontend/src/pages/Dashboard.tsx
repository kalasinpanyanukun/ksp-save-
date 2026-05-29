import { useEffect, useState } from "react";
import {
  Users,
  Stethoscope,
  BedDouble,
  Send,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import { useAppSelector } from "../store";
import {
  getDashboardStats,
  type DashboardStats,
} from "../services/reportsService";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  Icon: typeof Users;
  tone: "blue" | "orange" | "cyan" | "green";
  loading?: boolean;
}

const statTones = {
  blue: "text-ksp-blue-600",
  orange: "text-orange-600",
  cyan: "text-cyan-600",
  green: "text-emerald-700",
} as const;

function StatCard({
  label,
  value,
  hint,
  Icon,
  tone,
  loading,
}: StatCardProps) {
  return (
    <section className="p-1">
      <div className="flex min-h-[9.5rem] flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-bold leading-tight text-ksp-navy">
              {label}
            </p>
            {hint && <p className="mt-2 text-sm text-ksp-gray">{hint}</p>}
          </div>
          <div
            className={`grid h-12 w-12 shrink-0 place-items-center ${statTones[tone]}`}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div
          className={`mt-4 text-7xl font-extrabold leading-none tracking-normal ${statTones[tone]}`}
        >
          {loading ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : (
            value
          )}
        </div>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title={`สวัสดี ${user?.fullName ?? ""}`}
        description={`วันนี้: ${today}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="ผู้ใช้บริการวันนี้"
          value={stats?.opdToday ?? 0}
          hint={`เดือนนี้รวม ${stats?.opdMonth ?? 0}`}
          Icon={Stethoscope}
          tone="blue"
          loading={loading}
        />
        <StatCard
          label="กำลัง admit อยู่"
          value={stats?.activeAdmissions ?? 0}
          Icon={BedDouble}
          tone="orange"
          loading={loading}
        />
        <StatCard
          label="ส่งต่อ รพ. เดือนนี้"
          value={stats?.referralsMonth ?? 0}
          Icon={Send}
          tone="cyan"
          loading={loading}
        />
        <StatCard
          label="นักเรียนทั้งหมด"
          value={stats?.students ?? 0}
          Icon={Users}
          tone="green"
          loading={loading}
        />
      </div>

      <section className="relative mt-6 overflow-hidden rounded-lg border border-white/10 bg-ksp-navy p-5 text-white shadow-2xl">
        <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-1/3 h-24 w-72 rounded-full bg-ksp-blue-500/20 blur-2xl" />
        <div className="relative mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold text-white">ทางลัด</h2>
            <p className="mt-1 text-sm text-white/70">
              เข้าถึงงานหลักประจำวันได้ทันที
            </p>
          </div>
        </div>
        <div className="relative grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link
            to="/opd"
            className="group flex items-center justify-between rounded-lg border border-white/15 bg-white/10 px-5 py-4 text-white shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/16 hover:shadow-lg"
          >
            <span className="flex items-center gap-3 font-semibold">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/14">
                <Stethoscope className="h-5 w-5" />
              </span>
              บันทึก OPD
            </span>
            <Plus className="h-4 w-4 opacity-80 transition group-hover:rotate-90" />
          </Link>
          <Link
            to="/admissions"
            className="group flex items-center justify-between rounded-lg border border-white/15 bg-white/10 px-5 py-4 text-white shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/16 hover:shadow-lg"
          >
            <span className="flex items-center gap-3 font-semibold">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/14">
                <BedDouble className="h-5 w-5" />
              </span>
              รับ admit ใหม่
            </span>
            <Plus className="h-4 w-4 opacity-80 transition group-hover:rotate-90" />
          </Link>
          <Link
            to="/patients"
            className="group flex items-center justify-between rounded-lg border border-white/15 bg-white/10 px-5 py-4 text-white shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/16 hover:shadow-lg"
          >
            <span className="flex items-center gap-3 font-semibold">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/14">
                <Search className="h-5 w-5" />
              </span>
              ค้นหานักเรียน
            </span>
            <Plus className="h-4 w-4 opacity-80 transition group-hover:rotate-90" />
          </Link>
        </div>
      </section>
    </>
  );
}
