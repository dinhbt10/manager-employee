import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  Layers,
  LogOut,
  Users,
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navBase =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 border border-transparent";

export function AppLayout() {
  const { user, logout, canSeeDepartments, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white/85 shadow-sm shadow-zinc-200/60 backdrop-blur-md">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-100 bg-gradient-to-r from-brand-50/90 to-white px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 shadow-md shadow-brand-900/10 ring-2 ring-white">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-zinc-900">UTC People</p>
            <p className="text-[10px] uppercase tracking-wider text-brand-700/80">HR Suite</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 p-3">
          <NavLink
            to="/requests"
            className={({ isActive }) =>
              cn(
                navBase,
                isActive
                  ? "border-brand-200 bg-brand-50/90 font-semibold text-brand-900 shadow-sm"
                  : "text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
              )
            }
          >
            <ClipboardList className="h-4 w-4 shrink-0 text-teal-600" />
            Request
          </NavLink>
          <NavLink
            to="/employees"
            className={({ isActive }) =>
              cn(
                navBase,
                isActive
                  ? "border-brand-200 bg-brand-50/90 font-semibold text-brand-900 shadow-sm"
                  : "text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
              )
            }
          >
            <Users className="h-4 w-4 shrink-0 text-indigo-600" />
            Nhân viên
          </NavLink>
          {canSeeDepartments && (
            <NavLink
              to="/departments"
              className={({ isActive }) =>
                cn(
                  navBase,
                  isActive
                    ? "border-amber-200 bg-amber-50/90 font-semibold text-amber-950 shadow-sm"
                    : "text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
                )
              }
            >
              <Building2 className="h-4 w-4 shrink-0 text-amber-600" />
              Phòng ban
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/features"
              className={({ isActive }) =>
                cn(
                  navBase,
                  isActive
                    ? "border-teal-200 bg-teal-50/90 font-semibold text-teal-950 shadow-sm"
                    : "text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
                )
              }
            >
              <Layers className="h-4 w-4 shrink-0 text-teal-600" />
              Chức năng
            </NavLink>
          )}
        </nav>

        <div className="border-t border-zinc-100 bg-zinc-50/50 p-3">
          <div className="mb-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 shadow-sm">
            <p className="truncate text-sm font-medium text-zinc-900">{user?.fullName}</p>
            <p className="truncate text-xs text-zinc-500">{user?.username}</p>
            {user?.role === "ADMIN" && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-900">
                ADMIN
              </div>
            )}
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8 pb-16">
        <Outlet />
      </main>
    </div>
  );
}
