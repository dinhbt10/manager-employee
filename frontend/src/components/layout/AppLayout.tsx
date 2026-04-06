import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navBase =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all border border-transparent";

export function AppLayout() {
  const { user, logout, canSeeDepartments } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-zinc-950/90 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 shadow-lg">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">UTC People</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">HR Suite</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          <NavLink
            to="/requests"
            className={({ isActive }) =>
              cn(
                navBase,
                isActive
                  ? "bg-white/10 text-white border-white/10 shadow-inner"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              )
            }
          >
            <ClipboardList className="h-4 w-4 shrink-0 text-teal-400" />
            Request
          </NavLink>
          <NavLink
            to="/employees"
            className={({ isActive }) =>
              cn(
                navBase,
                isActive
                  ? "bg-white/10 text-white border-white/10 shadow-inner"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              )
            }
          >
            <Users className="h-4 w-4 shrink-0 text-indigo-400" />
            Nhân viên
          </NavLink>
          {canSeeDepartments && (
            <NavLink
              to="/departments"
              className={({ isActive }) =>
                cn(
                  navBase,
                  isActive
                    ? "bg-white/10 text-white border-white/10 shadow-inner"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                )
              }
            >
              <Building2 className="h-4 w-4 shrink-0 text-amber-400" />
              Phòng ban
            </NavLink>
          )}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="mb-3 rounded-xl bg-white/5 px-3 py-2 border border-white/5">
            <p className="truncate text-sm font-medium text-white">{user?.fullName}</p>
            <p className="truncate text-xs text-zinc-500">{user?.username}</p>
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

      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
