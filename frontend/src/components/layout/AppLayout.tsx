import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  Layers,
  LogOut,
  Users,
} from "lucide-react";
import { api } from "@/api/client";
import type { FeatureOption } from "@/api/types";
import { FeatureCodes } from "@/api/types";
import { roleLabel, useAuth } from "@/auth/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const navBase =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 border border-transparent";

export function AppLayout() {
  const { user, logout, hasFeature } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [featureOptions, setFeatureOptions] = useState<FeatureOption[]>([]);

  useEffect(() => {
    if (!profileOpen) return;
    void api
      .get<FeatureOption[]>("/features")
      .then((r) => setFeatureOptions(r.data))
      .catch(() => setFeatureOptions([]));
  }, [profileOpen]);

  const canSeeEmployees =
    hasFeature(FeatureCodes.EMP_VIEW_ALL) ||
    hasFeature(FeatureCodes.EMP_VIEW_DEPT);
  const canSeeDepartments = 
    user?.role === "ADMIN" || 
    (user?.role === "MANAGER" && user?.departmentId != null) ||
    hasFeature(FeatureCodes.DEPT_VIEW);
  const canSeeFeatures = hasFeature(FeatureCodes.FEATURE_VIEW);

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white/85 shadow-sm shadow-zinc-200/60 backdrop-blur-md">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-100 bg-gradient-to-r from-brand-50/90 to-white px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 shadow-md shadow-brand-900/10 ring-2 ring-white">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-zinc-900">
              UTC People
            </p>
            <p className="text-[10px] uppercase tracking-wider text-brand-700/80">
              HR Suite
            </p>
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
                  : "text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900",
              )
            }
          >
            <ClipboardList className="h-4 w-4 shrink-0 text-teal-600" />
            Request
          </NavLink>
          {canSeeEmployees && (
            <NavLink
              to="/employees"
              className={({ isActive }) =>
                cn(
                  navBase,
                  isActive
                    ? "border-brand-200 bg-brand-50/90 font-semibold text-brand-900 shadow-sm"
                    : "text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900",
                )
              }
            >
              <Users className="h-4 w-4 shrink-0 text-indigo-600" />
              Nhân viên
            </NavLink>
          )}
          {canSeeDepartments && (
            <NavLink
              to="/departments"
              className={({ isActive }) =>
                cn(
                  navBase,
                  isActive
                    ? "border-amber-200 bg-amber-50/90 font-semibold text-amber-950 shadow-sm"
                    : "text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900",
                )
              }
            >
              <Building2 className="h-4 w-4 shrink-0 text-amber-600" />
              Phòng ban
            </NavLink>
          )}
          {canSeeFeatures && (
            <NavLink
              to="/features"
              className={({ isActive }) =>
                cn(
                  navBase,
                  isActive
                    ? "border-teal-200 bg-teal-50/90 font-semibold text-teal-950 shadow-sm"
                    : "text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900",
                )
              }
            >
              <Layers className="h-4 w-4 shrink-0 text-teal-600" />
              Chức năng
            </NavLink>
          )}
        </nav>

        <div className="border-t border-zinc-100 bg-zinc-50/50 p-3">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className={cn(
              "mb-3 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left shadow-sm",
              "transition-colors hover:border-zinc-300 hover:bg-zinc-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40",
            )}
          >
            <p className="truncate text-sm font-semibold text-zinc-900">
              {user?.fullName}
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{user?.username}</p>
            {user?.role === "ADMIN" && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-900">
                ADMIN
              </div>
            )}
          </button>
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

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-xl">Thông tin tài khoản</DialogTitle>
            {user && (
              <p className="text-lg font-semibold leading-snug text-zinc-900">
                {user.fullName}
              </p>
            )}
          </DialogHeader>
          {user && (
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Tên đăng nhập
                </dt>
                <dd className="mt-0.5 font-mono text-zinc-900">{user.username}</dd>
              </div>
              {user.userId != null && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Mã người dùng
                  </dt>
                  <dd className="mt-0.5 font-mono text-zinc-900">{user.userId}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Vai trò
                </dt>
                <dd className="mt-1">
                  <Badge variant="secondary" className="font-normal">
                    {roleLabel(user.role)}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Phòng ban
                </dt>
                <dd className="mt-0.5 text-zinc-900">
                  {user.departmentName ?? "—"}
                  {user.departmentId != null && (
                    <span className="ml-1.5 font-mono text-xs text-zinc-500">
                      (ID: {user.departmentId})
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Chức năng được gán
                </dt>
                <dd className="mt-2 space-y-2">
                  {user.role === "ADMIN" && user.features.length === 0 ? (
                    <Badge className="bg-zinc-900 font-normal text-white hover:bg-zinc-900">
                      Toàn quyền hệ thống
                    </Badge>
                  ) : user.role === "MANAGER" && user.departmentId ? (
                    <>
                      <p className="text-xs leading-relaxed text-zinc-600">
                        <strong>Quyền tự động của Quản lý phòng ban:</strong>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="font-normal">
                          ✓ Xem nhân viên trong phòng
                        </Badge>
                        <Badge variant="secondary" className="font-normal">
                          ✓ Sửa nhân viên trong phòng
                        </Badge>
                        <Badge variant="secondary" className="font-normal">
                          ✓ Phê duyệt request trong phòng
                        </Badge>
                        <Badge variant="secondary" className="font-normal">
                          ✓ Xem phòng ban của mình
                        </Badge>
                      </div>
                      {user.features.length > 0 && (
                        <>
                          <p className="mt-3 text-xs leading-relaxed text-zinc-600">
                            <strong>Quyền bổ sung từ hệ thống:</strong>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {[...user.features].sort().map((code) => {
                              const name =
                                featureOptions.find((f) => f.code === code)?.name ??
                                code;
                              return (
                                <Badge
                                  key={code}
                                  variant="secondary"
                                  className="max-w-full font-normal"
                                  title={code}
                                >
                                  <span className="truncate">{name}</span>
                                </Badge>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </>
                  ) : user.features.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      Chưa có chức năng riêng trong cơ sở dữ liệu.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {[...user.features].sort().map((code) => {
                        const name =
                          featureOptions.find((f) => f.code === code)?.name ??
                          code;
                        return (
                          <Badge
                            key={code}
                            variant="secondary"
                            className="max-w-full font-normal"
                            title={code}
                          >
                            <span className="truncate">{name}</span>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
