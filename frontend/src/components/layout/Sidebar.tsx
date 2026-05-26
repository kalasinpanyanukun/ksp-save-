import { NavLink } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  BedDouble,
  Send,
  FileBarChart2,
  Wind,
  Pill,
  UserCog,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Brand from "./Brand";
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
  { to: "/patients", label: "นักเรียน / ผู้ป่วย", Icon: Users },
  { to: "/opd", label: "OPD - บันทึกการรักษา", Icon: Stethoscope },
  { to: "/admissions", label: "นอนพักรักษา", Icon: BedDouble },
  { to: "/referrals", label: "ส่งต่อโรงพยาบาล", Icon: Send },
  { to: "/reports", label: "รายงาน & สถิติ", Icon: FileBarChart2 },
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
        "fixed lg:static inset-y-0 left-0 z-40 transition-transform lg:translate-x-0",
        "w-64 bg-ksp-blue-800 text-white flex flex-col shadow-2xl",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="px-5 py-5 border-b border-white/10">
        <Brand variant="white" size="md" withTagline />
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {navItems
          .filter((i) => !i.adminOnly || user?.role === "admin")
          .map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-white shadow-inner"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )
              }
            >
              <Icon className="h-4.5 w-4.5" size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
      </nav>
      <div className="px-4 py-3 border-t border-white/10 text-xs text-white/60">
        <div>KSP SAVE+ v0.1.0</div>
        <div className="mt-0.5">โรงเรียนกาฬสินธุ์ปัญญานุกูล</div>
      </div>
      </aside>
    </>
  );
}
