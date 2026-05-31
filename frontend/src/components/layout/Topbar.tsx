import { Menu, LogOut, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { toggleSidebar } from "../../store/uiSlice";
import { clearUser } from "../../store/authSlice";
import { logout } from "../../services/authService";
import { useTopbarSearchValue } from "./TopbarSearchContext";
import type { TopbarSearchConfig } from "./TopbarSearchContext";

function openQuickSearch() {
  const event = new KeyboardEvent("keydown", {
    key: "k",
    ctrlKey: true,
    metaKey: true,
  });
  document.dispatchEvent(event);
}

function SearchControl({
  pageSearch,
}: {
  pageSearch: TopbarSearchConfig | null;
}) {
  if (pageSearch) {
    return (
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ksp-gray" />
        <input
          className="input h-11 pl-10 pr-10"
          placeholder={pageSearch.placeholder}
          value={pageSearch.value}
          onChange={(event) => pageSearch.onChange(event.target.value)}
        />
        {pageSearch.value && (
          <button
            type="button"
            aria-label="ล้างคำค้นหา"
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-ksp-gray hover:bg-ksp-blue-50 hover:text-ksp-blue-700"
            onClick={() => pageSearch.onChange("")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={openQuickSearch}
      className="flex h-11 w-full items-center gap-2 rounded-xl border border-ksp-blue-100 bg-ksp-bg/70 px-3 text-sm text-ksp-gray hover:bg-white"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">ค้นหานักเรียน...</span>
      <span className="hidden items-center gap-0.5 text-[11px] sm:flex">
        <kbd className="rounded border border-ksp-blue-100 bg-white px-1.5 py-0.5">
          Ctrl
        </kbd>
        <kbd className="rounded border border-ksp-blue-100 bg-white px-1.5 py-0.5">
          K
        </kbd>
      </span>
    </button>
  );
}

export default function Topbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pageSearch = useTopbarSearchValue();

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
    user?.role === "super_admin"
      ? "Super Admin"
      : user?.role === "admin"
        ? "ครูเรือนพยาบาล (Admin)"
        : "พี่เลี้ยงเรือนพยาบาล (User)";

  return (
    <header className="sticky top-0 z-30 border-b border-ksp-blue-50 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-2 px-3 sm:px-5 lg:px-6">
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ksp-navy hover:bg-ksp-blue-50 lg:hidden"
          aria-label="เปิดเมนู"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden max-w-xl flex-1 items-center lg:flex">
          <SearchControl pageSearch={pageSearch} />
        </div>
        <div className="relative ml-auto" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-ksp-blue-50 sm:gap-3 sm:px-2.5"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ksp-blue-400 to-ksp-blue-600 text-sm font-semibold text-white shadow-sm ring-2 ring-white">
              {user?.fullName?.charAt(0) ?? "?"}
            </div>
            <div className="hidden min-w-0 text-left sm:block">
              <div className="text-sm font-medium text-ksp-navy">
                {user?.fullName}
              </div>
              <div className="text-[11px] text-ksp-gray">{roleLabel}</div>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-ksp-gray" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-[min(16rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-ksp-blue-50 bg-white shadow-card">
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
      </div>
      <div className="border-t border-ksp-blue-50/70 px-3 pb-3 pt-2 sm:px-5 lg:hidden">
        <SearchControl pageSearch={pageSearch} />
      </div>
    </header>
  );
}
