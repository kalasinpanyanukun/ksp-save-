import { NavLink } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  BedDouble,
  Send,
  FileBarChart2,
  HeartPulse,
  Wind,
  Pill,
  UserCog,
  Settings,
  ShieldCheck,
  Activity,
  Scale,
  ClipboardCheck,
  ShieldPlus,
  Syringe,
  ArrowRightLeft,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { setSidebar } from "../../store/uiSlice";

interface NavItem {
  to: string;
  label: string;
  Icon: typeof LayoutDashboard;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "งานประจำวัน",
    items: [
      { to: "/", label: "แดชบอร์ด", Icon: LayoutDashboard },
      { to: "/student-handoffs", label: "รับ-ส่งนักเรียน", Icon: ArrowRightLeft },
      { to: "/opd", label: "OPD - บันทึกการรักษา", Icon: Stethoscope },
      { to: "/admissions", label: "นอนพักรักษา", Icon: BedDouble },
      { to: "/referrals", label: "ส่งต่อโรงพยาบาล", Icon: Send },
    ],
  },
  {
    label: "ข้อมูลนักเรียน",
    items: [
      { to: "/patients", label: "ทะเบียนนักเรียน", Icon: Users },
      { to: "/student-health-data", label: "ข้อมูลสุขภาพนักเรียน", Icon: HeartPulse },
      { to: "/student-medication-data", label: "ยาประจำตัวนักเรียน", Icon: Pill },
    ],
  },
  {
    label: "รายงานสุขภาพ",
    items: [
      { to: "/health-disease", label: "โรคประจำตัวและการแพ้", Icon: Activity },
      { to: "/health-nutrition", label: "ภาวะโภชนาการ", Icon: Scale },
      { to: "/health-physical", label: "ผลการตรวจร่างกาย", Icon: ClipboardCheck },
      { to: "/health-contraception", label: "การคุมกำเนิด", Icon: ShieldPlus },
      { to: "/health-injection", label: "การฉีดยาคุม", Icon: Syringe },
    ],
  },
  {
    label: "คลังและสิ่งแวดล้อม",
    items: [
      { to: "/pm25", label: "PM 2.5", Icon: Wind },
      { to: "/medications", label: "คลังยา", Icon: Pill },
    ],
  },
  {
    label: "รายงานและผู้ดูแล",
    items: [
      { to: "/reports", label: "รายงาน & สถิติ", Icon: FileBarChart2 },
      { to: "/admin/users", label: "จัดการผู้ใช้", Icon: UserCog, adminOnly: true },
      { to: "/admin/audit", label: "Audit Log", Icon: ShieldCheck, adminOnly: true },
      { to: "/admin/settings", label: "ตั้งค่าระบบ", Icon: Settings, superAdminOnly: true },
    ],
  },
];

export default function Sidebar() {
  const user = useAppSelector((s) => s.auth.user);
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const dispatch = useAppDispatch();

  const canShow = (item: NavItem) =>
    (!item.adminOnly || user?.role === "super_admin" || user?.role === "admin") &&
    (!item.superAdminOnly || user?.role === "super_admin");

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="ปิดเมนู"
          className="fixed inset-0 z-30 bg-ksp-navy/40 backdrop-blur-sm lg:hidden"
          onClick={() => dispatch(setSidebar(false))}
        />
      )}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex h-[100svh] w-[min(19rem,86vw)] flex-col bg-ksp-blue-800 text-white shadow-2xl transition-transform duration-200 lg:w-64 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          <img
            src="/logo3.png"
            alt="KSP SAVE+"
            className="h-12 w-12 shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-bold text-white">ระบบบริหารเรือนพยาบาล</p>
            <p className="text-[11px] text-white/70">โรงเรียนกาฬสินธุ์ปัญญานุกูลฯ</p>
          </div>
          <button
            type="button"
            aria-label="ปิดเมนู"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/75 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => dispatch(setSidebar(false))}
          >
            <X className="h-4.5 w-4.5" size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4" aria-label="เมนูหลัก">
          {navGroups.map((group) => {
            const items = group.items.filter(canShow);
            if (items.length === 0) return null;

            return (
              <section key={group.label} aria-label={group.label}>
                <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-white/55">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {items.map(({ to, label, Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === "/"}
                      onClick={() => dispatch(setSidebar(false))}
                      className={({ isActive }) =>
                        clsx(
                          "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/70",
                          isActive
                            ? "bg-white/15 text-white shadow-inner"
                            : "text-white/80 hover:bg-white/10 hover:text-white",
                        )
                      }
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" size={18} />
                      <span className="min-w-0 truncate">{label}</span>
                    </NavLink>
                  ))}
                </div>
              </section>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-4 py-3 text-white/65">
          <div className="text-xs font-semibold">KSP SAVE+ V 0.1.0</div>
          <div className="mt-0.5 whitespace-nowrap text-[9px] leading-4">
            โรงเรียนกาฬสินธุ์ปัญญานุกูล จังหวัดกาฬสินธุ์
          </div>
        </div>
      </aside>
    </>
  );
}
