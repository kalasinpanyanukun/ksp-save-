import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Toaster from "../common/Toaster";
import QuickSearch from "../common/QuickSearch";
import { useAppDispatch } from "../../store";
import { setSidebar } from "../../store/uiSlice";
import { TopbarSearchProvider } from "./TopbarSearchContext";

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
    <TopbarSearchProvider>
      <div className="flex min-h-screen overflow-x-hidden bg-gradient-to-br from-ksp-bg via-white to-ksp-blue-50/45">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <Topbar />
          <main className="mx-auto w-full max-w-[1400px] flex-1 p-3 sm:p-5 lg:p-8">
            {children}
          </main>
        </div>
        <QuickSearch />
        <Toaster />
      </div>
    </TopbarSearchProvider>
  );
}
