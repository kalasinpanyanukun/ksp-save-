import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import PatientListPage from "./pages/PatientList";
import PatientProfilePage from "./pages/PatientProfile";
import OPDRecordPage from "./pages/OPDRecord";
import AdmissionsPage from "./pages/Admissions";
import ReferralsPage from "./pages/Referrals";
import ReportsPage from "./pages/Reports";
import PM25Page from "./pages/PM25";
import MedicationStockPage from "./pages/MedicationStock";
import HelpPage from "./pages/Help";
import AdminUsersPage from "./pages/admin/Users";
import AdminAuditPage from "./pages/admin/AuditLog";
import AdminSettingsPage from "./pages/admin/Settings";

function Shell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Shell>
              <DashboardPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <Shell>
              <PatientListPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <ProtectedRoute>
            <Shell>
              <PatientProfilePage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/opd"
        element={
          <ProtectedRoute>
            <Shell>
              <OPDRecordPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admissions"
        element={
          <ProtectedRoute>
            <Shell>
              <AdmissionsPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/referrals"
        element={
          <ProtectedRoute>
            <Shell>
              <ReferralsPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Shell>
              <ReportsPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pm25"
        element={
          <ProtectedRoute>
            <Shell>
              <PM25Page />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/medications"
        element={
          <ProtectedRoute>
            <Shell>
              <MedicationStockPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <Shell>
              <HelpPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Shell>
              <AdminUsersPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Shell>
              <AdminAuditPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Shell>
              <AdminSettingsPage />
            </Shell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
