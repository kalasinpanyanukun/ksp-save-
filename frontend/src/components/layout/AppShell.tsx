import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Toaster from "../common/Toaster";
import QuickSearch from "../common/QuickSearch";
import { useAppDispatch } from "../../store";
import { setSidebar } from "../../store/uiSlice";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const dispatch = useAppDispatch();
  const location = useLocation();

  useEffect(() => {
    if (window.innerWidth < 1024) {
      dispatch(setSidebar(false));
    }
  }, [location.pathname, dispatch]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-ksp-bg via-white to-ksp-blue-50/45">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
      <QuickSearch />
      <Toaster />
    </div>
  );
}
