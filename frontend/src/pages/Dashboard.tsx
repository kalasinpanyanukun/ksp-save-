import { useEffect, useState } from "react";
import {
  Users,
  Stethoscope,
  BedDouble,
  Send,
  ArrowUpRight,
  Loader2,
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
  tone?: "blue" | "navy" | "accent" | "amber";
  loading?: boolean;
}

function StatCard({
  label,
  value,
  hint,
  Icon,
  tone = "blue",
  loading,
}: StatCardProps) {
  const toneClasses = {
    blue: "bg-ksp-blue-50 text-ksp-blue-700",
    navy: "bg-ksp-blue-100 text-ksp-blue-800",
    accent: "bg-ksp-blue-50 text-ksp-blue-500",
    amber: "bg-amber-50 text-amber-700",
  }[tone];
  return (
    <div className="card-pad flex items-center gap-4">
      <div
        className={`grid h-14 w-14 place-items-center rounded-2xl ${toneClasses}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-ksp-gray">{label}</div>
        <div className="text-2xl font-bold text-ksp-navy mt-0.5">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin inline" />
          ) : (
            value
          )}
        </div>
        {hint && <div className="mt-0.5 text-xs text-ksp-gray">{hint}</div>}
      </div>
    </div>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="ผู้ใช้บริการวันนี้"
          value={stats?.opdToday ?? 0}
          hint={`เดือนนี้รวม ${stats?.opdMonth ?? 0}`}
          Icon={Stethoscope}
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
          tone="accent"
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

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-pad lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-ksp-navy">
              คู่มือใช้งานเบื้องต้น
            </h2>
            <Link
              to="/reports"
              className="text-sm text-ksp-blue-500 hover:text-ksp-blue-700 inline-flex items-center gap-1"
            >
              ดูรายงาน <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ol className="space-y-2 text-sm text-ksp-navy/90">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-ksp-blue-500 text-white text-[11px] font-bold">
                1
              </span>
              ค้นหานักเรียนด้วย Ctrl+K หรือเลือกจากเมนู <strong>นักเรียน</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-ksp-blue-500 text-white text-[11px] font-bold">
                2
              </span>
              บันทึก <strong>OPD</strong> เมื่อมีการเข้ามารับยา/รักษาเบื้องต้น
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-ksp-blue-500 text-white text-[11px] font-bold">
                3
              </span>
              ถ้านอนพักเรือนพยาบาล ให้ใช้เมนู <strong>นอนพักรักษา</strong>{" "}
              และจำหน่ายเมื่อกลับ
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-ksp-blue-500 text-white text-[11px] font-bold">
                4
              </span>
              ถ้าต้องส่งโรงพยาบาล ใช้เมนู <strong>ส่งต่อโรงพยาบาล</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-ksp-blue-500 text-white text-[11px] font-bold">
                5
              </span>
              ดูสรุปสถิติและส่งออก PDF ที่ <strong>รายงาน &amp; สถิติ</strong>
            </li>
          </ol>
        </div>

        <div className="card-pad">
          <h2 className="text-base font-semibold text-ksp-navy mb-3">ทางลัด</h2>
          <div className="space-y-2">
            <Link to="/opd" className="btn-outline w-full justify-start">
              <Stethoscope className="h-4 w-4" /> บันทึก OPD
            </Link>
            <Link to="/admissions" className="btn-outline w-full justify-start">
              <BedDouble className="h-4 w-4" /> รับ admit ใหม่
            </Link>
            <Link to="/patients" className="btn-outline w-full justify-start">
              <Users className="h-4 w-4" /> ค้นหานักเรียน
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
