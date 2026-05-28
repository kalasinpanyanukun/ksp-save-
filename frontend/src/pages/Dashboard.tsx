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
  tone: "blue" | "navy" | "cyan" | "amber";
  loading?: boolean;
}

const statTones = {
  blue: "from-ksp-blue-700 to-ksp-blue-500",
  navy: "from-ksp-navy to-ksp-blue-800",
  cyan: "from-sky-600 to-cyan-500",
  amber: "from-amber-500 to-orange-500",
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
    <section
      className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${statTones[tone]} p-5 text-white shadow-card`}
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/12" />
      <div className="relative flex min-h-[9.5rem] flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/82">{label}</p>
            {hint && <p className="mt-1 text-xs text-white/72">{hint}</p>}
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white/16 text-white ring-1 ring-white/20">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 text-7xl font-extrabold leading-none tracking-normal text-white">
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
          tone="navy"
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
          tone="amber"
          loading={loading}
        />
      </div>

      <section className="mt-6 rounded-lg border border-ksp-blue-50 bg-white p-5 shadow-card">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-semibold text-ksp-navy">ทางลัด</h2>
            <p className="mt-1 text-sm text-ksp-gray">
              เข้าถึงงานหลักประจำวันได้ทันที
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link
            to="/opd"
            className="group flex items-center justify-between rounded-lg bg-ksp-blue-600 px-5 py-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ksp-blue-700 hover:shadow-md"
          >
            <span className="flex items-center gap-3 font-semibold">
              <Stethoscope className="h-5 w-5" /> บันทึก OPD
            </span>
            <Plus className="h-4 w-4 opacity-80 transition group-hover:rotate-90" />
          </Link>
          <Link
            to="/admissions"
            className="group flex items-center justify-between rounded-lg bg-ksp-navy px-5 py-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ksp-blue-800 hover:shadow-md"
          >
            <span className="flex items-center gap-3 font-semibold">
              <BedDouble className="h-5 w-5" /> รับ admit ใหม่
            </span>
            <Plus className="h-4 w-4 opacity-80 transition group-hover:rotate-90" />
          </Link>
          <Link
            to="/patients"
            className="group flex items-center justify-between rounded-lg bg-cyan-600 px-5 py-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-700 hover:shadow-md"
          >
            <span className="flex items-center gap-3 font-semibold">
              <Search className="h-5 w-5" /> ค้นหานักเรียน
            </span>
            <Plus className="h-4 w-4 opacity-80 transition group-hover:rotate-90" />
          </Link>
        </div>
      </section>
    </>
  );
}
