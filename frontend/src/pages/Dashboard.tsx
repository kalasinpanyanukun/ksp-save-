import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUpFromLine,
  BedDouble,
  ChevronRight,
  ClipboardList,
  Clock3,
  Droplets,
  Home,
  Loader2,
  LogOut,
  Package,
  Paintbrush,
  Pill,
  Send,
  Stethoscope,
  Tablet,
  Users,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import { useAppSelector } from "../store";
import {
  getDashboardStats,
  type DashboardStats,
} from "../services/reportsService";

type Tone = "blue" | "green" | "orange" | "rose" | "cyan" | "slate";

interface WorkflowItem {
  to: string;
  label: string;
  value: number;
  meta: string;
  action: string;
  Icon: LucideIcon;
  tone: Tone;
  critical?: boolean;
}

interface SignalItem {
  label: string;
  value: number;
  hint: string;
  Icon: LucideIcon;
  tone: Tone;
}

const toneStyles: Record<
  Tone,
  {
    badge: string;
    value: string;
    border: string;
    soft: string;
    row: string;
    rowHover: string;
  }
> = {
  blue: {
    badge: "bg-ksp-blue-50 text-ksp-blue-700",
    value: "text-ksp-blue-800",
    border: "border-ksp-blue-200",
    soft: "bg-ksp-blue-50/60",
    row: "bg-ksp-blue-800 text-white",
    rowHover: "hover:bg-ksp-blue-900",
  },
  green: {
    badge: "bg-emerald-50 text-emerald-800",
    value: "text-emerald-800",
    border: "border-emerald-200",
    soft: "bg-emerald-50/70",
    row: "bg-emerald-800 text-white",
    rowHover: "hover:bg-emerald-900",
  },
  orange: {
    badge: "bg-orange-50 text-orange-800",
    value: "text-orange-800",
    border: "border-orange-200",
    soft: "bg-orange-50/70",
    row: "bg-orange-700 text-white",
    rowHover: "hover:bg-orange-800",
  },
  rose: {
    badge: "bg-rose-50 text-rose-800",
    value: "text-rose-800",
    border: "border-rose-200",
    soft: "bg-rose-50/70",
    row: "bg-rose-800 text-white",
    rowHover: "hover:bg-rose-900",
  },
  cyan: {
    badge: "bg-cyan-50 text-cyan-800",
    value: "text-cyan-800",
    border: "border-cyan-200",
    soft: "bg-cyan-50/70",
    row: "bg-cyan-800 text-white",
    rowHover: "hover:bg-cyan-900",
  },
  slate: {
    badge: "bg-slate-100 text-slate-800",
    value: "text-slate-800",
    border: "border-slate-200",
    soft: "bg-slate-50",
    row: "bg-slate-800 text-white",
    rowHover: "hover:bg-slate-900",
  },
};

function valueOrZero(value: number | undefined, loading: boolean) {
  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;
  return value ?? 0;
}

function DigitalClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="rounded-xl border border-ksp-blue-100 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-ksp-blue-700">
        <Clock3 className="h-4 w-4" />
        เวลาปัจจุบัน
      </div>
      <div className="mt-2 font-mono text-4xl font-extrabold leading-none text-ksp-blue-900">
        {now.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </div>
    </div>
  );
}

function WorkflowRow({ item, loading }: { item: WorkflowItem; loading: boolean }) {
  const tone = toneStyles[item.tone];

  return (
    <Link
      to={item.to}
      className={`grid min-h-[7rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-xl px-5 py-4 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-ksp-blue-500 focus:ring-offset-2 ${tone.row} ${tone.rowHover}`}
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/20 text-white ring-1 ring-white/20">
        <item.Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-white">{item.label}</span>
          {item.critical && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white ring-1 ring-white/20">
              ต้องตรวจ
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm font-medium text-white/90">{item.meta}</span>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-white">
          {item.action}
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </span>
      <span className="min-w-16 text-right text-5xl font-extrabold leading-none text-white">
        {valueOrZero(item.value, loading)}
      </span>
    </Link>
  );
}

function SignalCard({ item, loading }: { item: SignalItem; loading: boolean }) {
  const tone = toneStyles[item.tone];

  return (
    <section className={`min-h-[6.75rem] rounded-xl border p-4 ${tone.border} ${tone.soft}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight text-ksp-navy">{item.label}</p>
          <p className="mt-1 text-xs font-medium text-ksp-gray">{item.hint}</p>
        </div>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone.badge}`}>
          <item.Icon className="h-4 w-4" />
        </span>
      </div>
      <div className={`mt-3 text-3xl font-extrabold leading-none ${tone.value}`}>
        {valueOrZero(item.value, loading)}
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

  const workflowItems: WorkflowItem[] = [
    {
      to: "/opd",
      label: "OPD วันนี้",
      value: stats?.opdToday ?? 0,
      meta: `เดือนนี้ ${stats?.opdMonth ?? 0} ครั้ง`,
      action: "บันทึกหรือค้นหา OPD",
      Icon: Stethoscope,
      tone: "blue",
    },
    {
      to: "/admissions",
      label: "ผู้ป่วยพักรักษา",
      value: stats?.activeAdmissions ?? 0,
      meta: "ติดตามอาการ จำหน่าย หรือส่งต่อ",
      action: "ดูรายการ admit",
      Icon: BedDouble,
      tone: "orange",
      critical: (stats?.activeAdmissions ?? 0) > 0,
    },
    {
      to: "/student-handoffs",
      label: "รับ-ส่งนักเรียนวันนี้",
      value: (stats?.studentCheckInsToday ?? 0) + (stats?.studentCheckOutsToday ?? 0),
      meta: `รายงานตัว ${stats?.studentCheckInsToday ?? 0} · กลับบ้าน ${stats?.studentCheckOutsToday ?? 0}`,
      action: "บันทึกรับ-ส่ง",
      Icon: ArrowRightLeft,
      tone: "green",
    },
    {
      to: "/medications",
      label: "ยาเหลือน้อย",
      value: stats?.medicationStock.lowStockTypes ?? 0,
      meta: "ตรวจ stock ก่อนจ่ายยา",
      action: "เปิดคลังยา",
      Icon: AlertTriangle,
      tone: "rose",
      critical: (stats?.medicationStock.lowStockTypes ?? 0) > 0,
    },
  ];

  const signalItems: SignalItem[] = [
    {
      label: "นักเรียนทั้งหมด",
      value: stats?.students ?? 0,
      hint: "ฐานข้อมูลที่ใช้งานอยู่",
      Icon: Users,
      tone: "slate",
    },
    {
      label: "นักเรียนประจำ",
      value: stats?.residentStudents ?? 0,
      hint: "พักในโรงเรียน",
      Icon: Home,
      tone: "green",
    },
    {
      label: "ลากลับบ้าน",
      value: stats?.homeLeaveStudents ?? 0,
      hint: "สถานะล่าสุด",
      Icon: LogOut,
      tone: "cyan",
    },
    {
      label: "มียาประจำตัว",
      value: stats?.studentsWithMedication ?? 0,
      hint: "ต้องระวังความถูกต้อง",
      Icon: Pill,
      tone: "rose",
    },
    {
      label: "ส่งต่อเดือนนี้",
      value: stats?.referralsMonth ?? 0,
      hint: "ติดตามเอกสารส่งต่อ",
      Icon: Send,
      tone: "orange",
    },
    {
      label: "ชนิดยาในคลัง",
      value: stats?.medicationStock.totalTypes ?? 0,
      hint: "รวมยาและเวชภัณฑ์",
      Icon: Package,
      tone: "blue",
    },
  ];

  const stockBreakdown: SignalItem[] = [
    {
      label: "ยาเม็ด",
      value: stats?.medicationStock.tablets ?? 0,
      hint: "หน่วยเม็ด",
      Icon: Tablet,
      tone: "blue",
    },
    {
      label: "ยาน้ำ",
      value: stats?.medicationStock.liquids ?? 0,
      hint: "หน่วยขวด",
      Icon: Droplets,
      tone: "cyan",
    },
    {
      label: "ยาทา",
      value: stats?.medicationStock.ointments ?? 0,
      hint: "หน่วยหลอด",
      Icon: Paintbrush,
      tone: "orange",
    },
    {
      label: "ยาพ่น",
      value: stats?.medicationStock.inhalers ?? 0,
      hint: "หน่วยหลอด",
      Icon: Wind,
      tone: "green",
    },
  ];

  return (
    <>
      <PageHeader
        title={`สวัสดี ${user?.fullName ?? ""}`}
        description="งานเรือนพยาบาลประจำวันที่ต้องจัดการให้เร็ว ชัดเจน และตรวจสอบได้"
        actions={
          <>
            <Link to="/opd" className="btn-primary">
              <Stethoscope className="h-4 w-4" />
              บันทึก OPD
            </Link>
            <Link to="/student-handoffs" className="btn-outline">
              <ArrowRightLeft className="h-4 w-4" />
              รับ-ส่ง
            </Link>
            <Link to="/patients" className="btn-outline">
              <Users className="h-4 w-4" />
              ค้นหานักเรียน
            </Link>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.65fr)]">
        <section className="flex min-h-[36rem] flex-col rounded-2xl border border-ksp-blue-100 bg-ksp-bg/50 p-4 shadow-card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-ksp-navy">
                <ClipboardList className="h-5 w-5 text-ksp-blue-700" />
                คิวงานวันนี้
              </h2>
              <p className="mt-1 text-sm font-medium text-ksp-gray">
                เริ่มจากงานที่มีผลต่อผู้ป่วยและยาโดยตรง
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-ksp-blue-700 ring-1 ring-ksp-blue-100">
              {today}
            </span>
          </div>
          <div className="grid flex-1 grid-rows-4 gap-3">
            {workflowItems.map((item) => (
              <WorkflowRow key={item.to} item={item} loading={loading} />
            ))}
          </div>
        </section>

        <aside className="grid gap-4">
          <DigitalClock />
          <section className="rounded-2xl border border-ksp-blue-100 bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-ksp-navy">
                <Activity className="h-5 w-5 text-ksp-blue-700" />
                สรุปรับ-ส่ง
              </h2>
              <Link to="/student-handoffs" className="text-xs font-bold text-ksp-blue-700 hover:text-ksp-blue-900">
                เปิดรายการ
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <section className="rounded-xl bg-emerald-50 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <ArrowDownToLine className="h-4 w-4" />
                  รายงานตัว
                </div>
                <div className="mt-2 text-3xl font-extrabold text-emerald-900">
                  {valueOrZero(stats?.studentCheckInsToday, loading)}
                </div>
                <p className="mt-1 text-xs font-medium text-emerald-800">
                  เดือนนี้ {stats?.studentCheckInsMonth ?? 0}
                </p>
              </section>
              <section className="rounded-xl bg-rose-50 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                  <ArrowUpFromLine className="h-4 w-4" />
                  กลับบ้าน
                </div>
                <div className="mt-2 text-3xl font-extrabold text-rose-900">
                  {valueOrZero(stats?.studentCheckOutsToday, loading)}
                </div>
                <p className="mt-1 text-xs font-medium text-rose-800">
                  เดือนนี้ {stats?.studentCheckOutsMonth ?? 0}
                </p>
              </section>
            </div>
          </section>
          <section className="rounded-2xl border border-ksp-blue-100 bg-white p-4 shadow-card">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-ksp-navy">
              <Package className="h-5 w-5 text-ksp-blue-700" />
              แยกประเภทคลังยา
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {stockBreakdown.map((item) => (
                <SignalCard key={item.label} item={item} loading={loading} />
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="mt-5 rounded-2xl border border-ksp-blue-100 bg-white p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-ksp-navy">สัญญาณที่ต้องติดตาม</h2>
            <p className="mt-1 text-sm font-medium text-ksp-gray">
              ตัวเลขสำคัญที่ช่วยกันพลาดเรื่องนักเรียน ยา และเอกสารส่งต่อ
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {signalItems.map((item) => (
            <SignalCard key={item.label} item={item} loading={loading} />
          ))}
        </div>
      </section>
    </>
  );
}
