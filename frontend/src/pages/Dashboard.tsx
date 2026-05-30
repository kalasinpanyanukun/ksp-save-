import { useEffect, useState } from "react";
import {
  Users,
  Stethoscope,
  BedDouble,
  Send,
  Loader2,
  Plus,
  Search,
  Home,
  LogOut,
  Pill,
  Package,
  Tablet,
  Droplets,
  Paintbrush,
  Wind,
  AlertTriangle,
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
  tone: "blue" | "orange" | "cyan" | "green" | "violet" | "rose" | "slate";
  loading?: boolean;
}

const statTones = {
  blue: "text-ksp-blue-600",
  orange: "text-orange-600",
  cyan: "text-cyan-600",
  green: "text-emerald-700",
  violet: "text-violet-600",
  rose: "text-rose-600",
  slate: "text-slate-700",
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
    <section className="flex min-h-[9.5rem] flex-col justify-between bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-bold leading-tight text-ksp-navy">{label}</p>
          {hint && <p className="mt-2 text-sm text-ksp-gray">{hint}</p>}
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ksp-blue-50/60 ${statTones[tone]}`}>
          <Icon className="h-5.5 w-5.5" size={22} />
        </div>
      </div>
      <div className={`mt-4 text-6xl font-extrabold leading-none tracking-tight ${statTones[tone]}`}>
        {loading ? <Loader2 className="h-9 w-9 animate-spin" /> : value}
      </div>
    </section>
  );
}

function MiniStat({
  label,
  value,
  Icon,
  tone,
  loading,
}: StatCardProps) {
  return (
    <section className="flex min-h-[6.5rem] items-start justify-between gap-3 bg-white p-5">
      <div>
        <p className="text-sm font-semibold leading-tight text-ksp-navy">{label}</p>
        <div className={`mt-2 text-4xl font-extrabold leading-none tracking-tight ${statTones[tone]}`}>
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : value}
        </div>
      </div>
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ksp-blue-50/60 ${statTones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </section>
  );
}

const shortcuts = [
  { to: "/opd", label: "บันทึก OPD", Icon: Stethoscope, cls: "from-ksp-blue-500 to-ksp-blue-600" },
  { to: "/admissions", label: "รับ admit ใหม่", Icon: BedDouble, cls: "from-orange-500 to-orange-600" },
  { to: "/patients", label: "ค้นหานักเรียน", Icon: Search, cls: "from-emerald-500 to-emerald-600" },
];

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

  const additionalStats: StatCardProps[] = [
    {
      label: "นักเรียนประจำโรงเรียน",
      value: stats?.residentStudents ?? 0,
      hint: "พักที่โรงเรียน",
      Icon: Home,
      tone: "green",
      loading,
    },
    {
      label: "นักเรียนกลับบ้าน",
      value: stats?.homeLeaveStudents ?? 0,
      Icon: LogOut,
      tone: "cyan",
      loading,
    },
    {
      label: "มียาประจำตัว",
      value: stats?.studentsWithMedication ?? 0,
      Icon: Pill,
      tone: "violet",
      loading,
    },
    {
      label: "ชนิดยาในคลัง",
      value: stats?.medicationStock.totalTypes ?? 0,
      Icon: Package,
      tone: "slate",
      loading,
    },
    {
      label: "เวชภัณฑ์มิใช่ยา",
      value: stats?.medicationStock.nonMedicineTypes ?? 0,
      Icon: Package,
      tone: "violet",
      loading,
    },
    {
      label: "ยาเม็ด",
      value: stats?.medicationStock.tablets ?? 0,
      Icon: Tablet,
      tone: "blue",
      loading,
    },
    {
      label: "ยาน้ำ (ขวด)",
      value: stats?.medicationStock.liquids ?? 0,
      Icon: Droplets,
      tone: "cyan",
      loading,
    },
    {
      label: "ยาทา (หลอด)",
      value: stats?.medicationStock.ointments ?? 0,
      Icon: Paintbrush,
      tone: "orange",
      loading,
    },
    {
      label: "ยาพ่น (หลอด)",
      value: stats?.medicationStock.inhalers ?? 0,
      Icon: Wind,
      tone: "green",
      loading,
    },
    {
      label: "ชนิดที่เหลือน้อย",
      value: stats?.medicationStock.lowStockTypes ?? 0,
      Icon: AlertTriangle,
      tone: "rose",
      loading,
    },
  ];

  return (
    <>
      <PageHeader
        title={`สวัสดี ${user?.fullName ?? ""}`}
        description={`วันนี้: ${today}`}
        actions={shortcuts.map(({ to, label, Icon, cls }) => (
          <Link
            key={to}
            to={to}
            className={`btn bg-gradient-to-b ${cls} text-white shadow-sm hover:shadow-md`}
          >
            <Icon className="h-4 w-4" /> {label}
            <Plus className="h-3.5 w-3.5 opacity-80" />
          </Link>
        ))}
      />

      {/* Stats as a blue grid (gap-px reveals blue grid lines) */}
      <div className="overflow-hidden rounded-2xl bg-ksp-blue-100 shadow-card ring-1 ring-ksp-blue-100">
        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="ผู้ใช้บริการวันนี้"
            value={stats?.opdToday ?? 0}
            hint={`เดือนนี้รวม ${stats?.opdMonth ?? 0}`}
            Icon={Stethoscope}
            tone="blue"
            loading={loading}
          />
          <StatCard label="กำลัง admit อยู่" value={stats?.activeAdmissions ?? 0} Icon={BedDouble} tone="orange" loading={loading} />
          <StatCard label="ส่งต่อ รพ. เดือนนี้" value={stats?.referralsMonth ?? 0} Icon={Send} tone="cyan" loading={loading} />
          <StatCard label="นักเรียนทั้งหมด" value={stats?.students ?? 0} Icon={Users} tone="green" loading={loading} />
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl bg-ksp-blue-100 shadow-card ring-1 ring-ksp-blue-100">
        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 xl:grid-cols-3">
          {additionalStats.map((item) => (
            <MiniStat key={item.label} {...item} />
          ))}
        </div>
      </div>
    </>
  );
}
