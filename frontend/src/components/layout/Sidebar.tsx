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
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { setSidebar } from "../../store/uiSlice";

interface NavItem {
  to: string;
  label: string;
  Icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: "/", label: "แดชบอร์ด", Icon: LayoutDashboard },
  { to: "/patients", label: "ข้อมูลนักเรียน", Icon: Users },
  { to: "/opd", label: "OPD - บันทึกการรักษา", Icon: Stethoscope },
  { to: "/admissions", label: "นอนพักรักษา", Icon: BedDouble },
  { to: "/referrals", label: "ส่งต่อโรงพยาบาล", Icon: Send },
  { to: "/reports", label: "รายงาน & สถิติ", Icon: FileBarChart2 },
  { to: "/student-health-data", label: "ข้อมูลสุขภาพนักเรียน", Icon: HeartPulse },
  { to: "/student-medication-data", label: "ข้อมูลยาประจำตัวนักเรียน", Icon: Pill },
  { to: "/pm25", label: "PM 2.5", Icon: Wind },
  { to: "/medications", label: "คลังยา", Icon: Pill },
  { to: "/admin/users", label: "จัดการผู้ใช้", Icon: UserCog, adminOnly: true },
  { to: "/admin/audit", label: "Audit Log", Icon: ShieldCheck, adminOnly: true },
  { to: "/admin/settings", label: "ตั้งค่าระบบ", Icon: Settings, adminOnly: true },
];

export default function Sidebar() {
  const user = useAppSelector((s) => s.auth.user);
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const dispatch = useAppDispatch();

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
          "fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col bg-ksp-blue-800 text-white shadow-2xl transition-transform lg:sticky lg:top-0 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          <img
            src="/logo3.png"
            alt="KSP SAVE+"
            className="h-12 w-12 shrink-0 object-contain"
          />
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">ระบบบริหารจัดการเรือนพยาบาล</p>
            <p className="text-[11px] text-white/70">โรงเรียนกาฬสินธุ์ปัญญานุกูลฯ</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems
            .filter(
              (i) =>
                !i.adminOnly ||
                user?.role === "super_admin" ||
                user?.role === "admin",
            )
            .map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/16 text-white shadow-inner"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  )
                }
              >
                <Icon className="h-4.5 w-4.5" size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
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
