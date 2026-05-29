import { Menu, LogOut, ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("pointerdown", handlePointerDown);
    }

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen]);

  async function handleLogout() {
    await logout();
    dispatch(clearUser());
    navigate("/login", { replace: true });
  }

  const roleLabel =
    user?.role === "admin" ? "Super Admin" : "พี่เลี้ยงเรือนพยาบาล";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ksp-blue-50 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={() => dispatch(toggleSidebar())}
        className="rounded-lg p-2 text-ksp-navy hover:bg-ksp-blue-50 lg:hidden"
        aria-label="เปิดเมนู"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden max-w-md flex-1 items-center gap-4 lg:flex">
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
          className="flex w-full items-center gap-2 rounded-lg border border-ksp-blue-100 bg-ksp-bg/70 px-3 py-2 text-sm text-ksp-gray hover:bg-white"
        >
          <Search className="h-4 w-4" />
          <span>ค้นหานักเรียน...</span>
          <span className="ml-auto flex items-center gap-0.5 text-[11px]">
            <kbd className="rounded border border-ksp-blue-100 bg-white px-1.5 py-0.5">
              Ctrl
            </kbd>
            <kbd className="rounded border border-ksp-blue-100 bg-white px-1.5 py-0.5">
              K
            </kbd>
          </span>
        </button>
      </div>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-3 rounded-lg px-2.5 py-1.5 hover:bg-ksp-blue-50"
        >
          <div className="grid h-9 w-9 place-items-center rounded-full bg-ksp-blue-500 text-sm font-semibold text-white">
            {user?.fullName?.charAt(0) ?? "?"}
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-sm font-medium text-ksp-navy">
              {user?.fullName}
            </div>
            <div className="text-[11px] text-ksp-gray">{roleLabel}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-ksp-gray" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-ksp-blue-50 bg-white shadow-card">
            <div className="border-b border-ksp-blue-50 px-4 py-3">
              <div className="text-sm font-medium text-ksp-navy">
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
