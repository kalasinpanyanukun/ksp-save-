import { Menu, LogOut, ChevronDown, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { toggleSidebar } from "../../store/uiSlice";
import { clearUser } from "../../store/authSlice";
import { logout } from "../../services/authService";

export default function Topbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    dispatch(clearUser());
    navigate("/login", { replace: true });
  }

  const roleLabel =
    user?.role === "admin" ? "ครูเรือนพยาบาล (Admin)" : "พี่เลี้ยงเรือนพยาบาล";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white/90 backdrop-blur border-b border-ksp-blue-50 px-4 sm:px-6">
      <button
        type="button"
        onClick={() => dispatch(toggleSidebar())}
        className="rounded-xl p-2 text-ksp-navy hover:bg-ksp-blue-50 lg:hidden"
        aria-label="เปิดเมนู"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden lg:flex items-center gap-4 flex-1 max-w-md">
        <button
          type="button"
          onClick={() => {
            const ev = new KeyboardEvent("keydown", {
              key: "k",
              ctrlKey: true,
              metaKey: true,
            });
            document.dispatchEvent(ev);
          }}
          className="flex items-center gap-2 w-full rounded-xl border border-ksp-blue-100 bg-ksp-bg/70 px-3 py-2 text-sm text-ksp-gray hover:bg-white"
        >
          <Search className="h-4 w-4" />
          <span>ค้นหานักเรียน...</span>
          <span className="ml-auto flex items-center gap-0.5 text-[11px]">
            <kbd className="rounded bg-white border border-ksp-blue-100 px-1.5 py-0.5">
              Ctrl
            </kbd>
            <kbd className="rounded bg-white border border-ksp-blue-100 px-1.5 py-0.5">
              K
            </kbd>
          </span>
        </button>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-3 rounded-xl px-2.5 py-1.5 hover:bg-ksp-blue-50"
        >
          <div className="grid h-9 w-9 place-items-center rounded-full bg-ksp-blue-500 text-white text-sm font-semibold">
            {user?.fullName?.charAt(0) ?? "?"}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-medium text-ksp-navy">
              {user?.fullName}
            </div>
            <div className="text-[11px] text-ksp-gray">{roleLabel}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-ksp-gray" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-ksp-blue-50 bg-white shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-ksp-blue-50">
              <div className="font-medium text-ksp-navy text-sm">
                {user?.fullName}
              </div>
              <div className="text-xs text-ksp-gray">{user?.username}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
