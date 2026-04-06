import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { DepartmentsPage } from "@/pages/DepartmentsPage";
import { EmployeesPage } from "@/pages/EmployeesPage";
import { LoginPage } from "@/pages/LoginPage";
import { RequestsPage } from "@/pages/RequestsPage";

function RequireAuth() {
  const { token } = useAuth();
  const loc = useLocation();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return <Outlet />;
}

function AdminRoute() {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/requests" replace />;
  }
  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/requests" replace />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/departments" element={<DepartmentsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/requests" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
