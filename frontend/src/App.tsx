import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { DepartmentsPage } from "@/pages/DepartmentsPage";
import { EmployeesPage } from "@/pages/EmployeesPage";
import { LoginPage } from "@/pages/LoginPage";
import { FeaturesPage } from "@/pages/FeaturesPage";
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
            <Route path="/features" element={<FeaturesPage />} />
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
        <Toaster
          richColors
          closeButton
          position="top-right"
          theme="light"
          toastOptions={{
            classNames: {
              toast: "border border-zinc-200 bg-white/95 text-zinc-900 shadow-lg shadow-zinc-300/40 backdrop-blur-sm",
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
