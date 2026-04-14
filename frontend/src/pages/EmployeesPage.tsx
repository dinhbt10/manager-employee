import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { Department, FeatureOption, Role, User } from "@/api/types";
import { useAuth, roleLabel } from "@/auth/AuthContext";
import { CellWithTooltip } from "@/components/CellWithTooltip";
import { ListSearchBar } from "@/components/ListSearchBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import { Eye, Pencil, UserPlus } from "lucide-react";

/**
 * ADMIN / MANAGER có quyền theo vai trò (AccessPolicy) dù `user.features` từ DB có thể rỗng.
 * Chỉ EMPLOYEE (và trường hợp có gán thêm) mới hiển thị đúng danh sách mã trong `user_features`.
 */
function permissionBadges(user: User) {
  if (user.role === "ADMIN") {
    return (
      <Badge key="admin-all" variant="default" className="bg-zinc-900 text-white hover:bg-zinc-900">
        Toàn quyền hệ thống
      </Badge>
    );
  }
  if (user.role === "MANAGER" && user.features.length === 0) {
    return (
      <Badge key="mgr-scope" variant="secondary">
        Đủ quyền trong phòng ban
      </Badge>
    );
  }
  if (user.features.length === 0) {
    return (
      <Badge key="ro" variant="warning">
        Chỉ xem
      </Badge>
    );
  }
  return user.features.map((c) => (
    <Badge key={c} variant="secondary" className="font-mono text-[10px]">
      {c}
    </Badge>
  ));
}

function permissionTooltip(user: User): string {
  if (user.role === "ADMIN") {
    return "Quản trị viên — toàn quyền (không cần gán từng chức năng trong DB)";
  }
  if (user.role === "MANAGER" && user.features.length === 0) {
    return "Quản lý — đủ quyền với nhân viên thuộc phòng ban của mình";
  }
  return user.features.join(", ") || "Chỉ xem (chưa cấp chức năng)";
}

export function EmployeesPage() {
  const { isAdmin, isManager } = useAuth();
  const [rows, setRows] = useState<User[]>([]);
  const [features, setFeatures] = useState<FeatureOption[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailUser, setDetailUser] = useState<User | null>(null);

  const [qInput, setQInput] = useState("");
  const [advOpen, setAdvOpen] = useState(false);
  const [advRole, setAdvRole] = useState<"" | Role>("");
  const [advDeptId, setAdvDeptId] = useState<number | "">("");
  const [applied, setApplied] = useState<{ q: string; role: string; departmentId?: number }>({
    q: "",
    role: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (applied.q.trim()) params.q = applied.q.trim();
      if (applied.role) params.role = applied.role;
      if (applied.departmentId != null) params.departmentId = applied.departmentId;

      const [u, f] = await Promise.all([
        api.get<User[]>("/users", { params }),
        api.get<FeatureOption[]>("/features"),
      ]);
      setRows(u.data);
      setFeatures(f.data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không tải được danh sách nhân viên"));
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isAdmin) return;
    void api
      .get<Department[]>("/departments")
      .then((r) => setDepartments(r.data))
      .catch(() => {});
  }, [isAdmin]);

  function applyQuickSearch() {
    setApplied((prev) => ({ ...prev, q: qInput.trim() }));
  }

  function applyAdvancedSearch() {
    setApplied({
      q: qInput.trim(),
      role: advRole,
      departmentId: advDeptId === "" ? undefined : advDeptId,
    });
  }


  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Nhân viên"
        description="Danh sách theo phân quyền: Admin toàn hệ thống; Quản lý theo phòng; NV chỉ thấy hồ sơ của mình."
        actions={isAdmin ? <CreateUserDialog features={features} onDone={load} /> : null}
      />
      <Card>
        <CardContent className="space-y-0 p-0 pt-6">
          <ListSearchBar
            q={qInput}
            onQChange={setQInput}
            onSearch={applyQuickSearch}
            placeholder="Họ tên, mã NV, username, phòng ban…"
            advancedOpen={advOpen}
            onAdvancedOpenChange={(open) => {
              if (open) {
                setAdvRole((applied.role as "" | Role) || "");
                setAdvDeptId(applied.departmentId ?? "");
              }
              setAdvOpen(open);
            }}
            onApplyAdvanced={applyAdvancedSearch}
            advancedChildren={
              <div className="space-y-4">
                <div>
                  <Label>Vai trò</Label>
                  <select
                    className={cn(
                      "mt-1 flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm"
                    )}
                    value={advRole}
                    onChange={(e) => setAdvRole(e.target.value as "" | Role)}
                  >
                    <option value="">Tất cả</option>
                    <option value="ADMIN">Quản trị</option>
                    <option value="MANAGER">Quản lý</option>
                    <option value="EMPLOYEE">Nhân viên</option>
                  </select>
                </div>
                {isAdmin && (
                  <div>
                    <Label>Phòng ban</Label>
                    <select
                      className={cn(
                        "mt-1 flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm"
                      )}
                      value={advDeptId === "" ? "" : String(advDeptId)}
                      onChange={(e) =>
                        setAdvDeptId(e.target.value === "" ? "" : Number(e.target.value))
                      }
                    >
                      <option value="">Tất cả</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-zinc-600"
                  onClick={() => {
                    setAdvRole("");
                    setAdvDeptId("");
                    setApplied({ q: qInput.trim(), role: "", departmentId: undefined });
                  }}
                >
                  Xóa bộ lọc nâng cao
                </Button>
              </div>
            }
          />
          {loading ? (
            <TableSkeleton rows={8} columns={6} />
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500">
              {applied.q || applied.role || applied.departmentId != null
                ? "Không có nhân viên phù hợp bộ lọc."
                : "Chưa có dữ liệu nhân viên."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Mã NV</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Quyền</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((u) => (
                  <TableRow
                    key={u.id}
                    className="cursor-pointer transition-colors"
                    onDoubleClick={() => setDetailUser(u)}
                  >
                    <TableCell className="max-w-[120px] font-mono text-xs">
                      <CellWithTooltip text={u.employeeCode} />
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <CellWithTooltip text={u.fullName} />
                    </TableCell>
                    <TableCell>
                      <CellWithTooltip text={roleLabel(u.role)} />
                    </TableCell>
                    <TableCell className="max-w-[180px] text-zinc-600">
                      <CellWithTooltip text={u.departmentName ?? undefined} />
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <div className="flex flex-wrap gap-1" title={permissionTooltip(u)}>
                        {permissionBadges(u)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-zinc-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailUser(u);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Chi tiết
                        </Button>
                        {isManager && !isAdmin && (
                          <ManagerEditEmployeeDialog user={u} onDone={load} />
                        )}
                        {isAdmin && <EditUserDialog user={u} features={features} onDone={load} />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EmployeeDetailDialog user={detailUser} open={detailUser !== null} onOpenChange={(o) => !o && setDetailUser(null)} />
    </div>
  );
}

function EmployeeDetailDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Chi tiết nhân viên</DialogTitle>
        </DialogHeader>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Mã NV</dt>
            <dd className="mt-0.5 font-mono text-zinc-900">{user.employeeCode}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Họ tên</dt>
            <dd className="mt-0.5 text-zinc-900">{user.fullName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Username</dt>
            <dd className="mt-0.5 font-mono text-zinc-900">{user.username}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Vai trò</dt>
            <dd className="mt-0.5 text-zinc-900">{roleLabel(user.role)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Phòng ban</dt>
            <dd className="mt-0.5 text-zinc-900">{user.departmentName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Chức năng đã cấp</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1">{permissionBadges(user)}</dd>
          </div>
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function ManagerEditEmployeeDialog({ user, onDone }: { user: User; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(user.fullName);
  }, [user.fullName, user.id]);

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/users/${user.id}`, { fullName: fullName.trim() });
      toast.success("Đã cập nhật thông tin nhân viên");
      setOpen(false);
      onDone();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" onClick={(e) => e.stopPropagation()}>
          <Pencil className="h-3 w-3" />
          Sửa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa thông tin — {user.employeeCode}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Họ tên</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <Button className="w-full" onClick={() => void save()} disabled={!fullName.trim() || saving}>
            {saving && <Spinner />}
            Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  features,
  onDone,
}: {
  user: User;
  features: FeatureOption[];
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(user.features));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(user.fullName);
    setSelected(new Set(user.features));
  }, [user.features, user.fullName, user.id]);

  const featureOptions = useMemo(() => {
    const byCode = new Map(features.map((f) => [f.code, f]));
    for (const code of user.features) {
      if (!byCode.has(code)) {
        byCode.set(code, { code, name: `${code} (đã ngưng)` });
      }
    }
    return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
  }, [features, user.features]);

  function toggle(code: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });
  }

  async function save() {
    setSaving(true);
    try {
      if (user.role === "ADMIN") {
        await api.patch(`/users/${user.id}`, { fullName: fullName.trim() });
        toast.success("Đã cập nhật nhân viên");
      } else {
        const activeCodes = new Set(features.map((f) => f.code));
        const featureCodes = [...selected].filter((code) => activeCodes.has(code));
        const droppedInactive = [...selected].filter((code) => !activeCodes.has(code));
        if (droppedInactive.length > 0) {
          toast.info(`Đã gỡ ${droppedInactive.length} mã đã ngưng khỏi phân quyền.`);
        }
        await api.patch(`/users/${user.id}`, {
          fullName: fullName.trim(),
          featureCodes,
        });
        toast.success("Đã cập nhật nhân viên và phân quyền");
      }
      setOpen(false);
      onDone();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" onClick={(e) => e.stopPropagation()}>
          <Pencil className="h-3 w-3" />
          Phân quyền
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Phân quyền — {user.fullName}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-zinc-500">
          {user.role === "ADMIN" ? (
            <>
              Quản trị viên có <strong>toàn quyền hệ thống</strong> theo code (không cần gán từng chức năng trong DB).
              Chỉnh họ tên bên dưới nếu cần.
            </>
          ) : (
            <>Chọn nhiều chức năng (multi-select). Nhân viên không có quyền sẽ chỉ xem được dữ liệu.</>
          )}
        </p>
        <div>
          <Label>Họ tên</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
        </div>
        {user.role !== "ADMIN" && (
          <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/50 p-3">
            {featureOptions.map((f) => (
              <label key={f.code} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.has(f.code)}
                  onChange={() => toggle(f.code)}
                  className="rounded border-zinc-300"
                />
                <span>{f.name}</span>
                <span className="font-mono text-xs text-zinc-500">{f.code}</span>
              </label>
            ))}
          </div>
        )}
        <Button className="w-full" onClick={() => void save()} disabled={!fullName.trim() || saving}>
          {saving && <Spinner />}
          Lưu
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function CreateUserDialog({
  features,
  onDone,
}: {
  features: FeatureOption[];
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"EMPLOYEE" | "MANAGER">("EMPLOYEE");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggle(code: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await api.post("/users", {
        fullName: fullName.trim(),
        username: username.trim(),
        password,
        role,
        departmentId: null,
        featureCodes: [...selected],
      });
      toast.success("Đã tạo nhân viên mới");
      setOpen(false);
      setFullName("");
      setUsername("");
      setPassword("");
      setSelected(new Set());
      onDone();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" />
          Thêm nhân viên
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm nhân viên (Admin)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Họ tên</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <Label>Mật khẩu</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label>Vai trò</Label>
            <select
              className={cn(
                "flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm"
              )}
              value={role}
              onChange={(e) => setRole(e.target.value as "EMPLOYEE" | "MANAGER")}
            >
              <option value="EMPLOYEE">Nhân viên</option>
              <option value="MANAGER">Quản lý</option>
            </select>
          </div>
          <div>
            <Label>Quyền chức năng</Label>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/50 p-3">
              {features.map((f) => (
                <label key={f.code} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.has(f.code)}
                    onChange={() => toggle(f.code)}
                    className="rounded border-zinc-300"
                  />
                  <span>{f.name}</span>
                </label>
              ))}
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => void save()}
            disabled={!fullName.trim() || !username.trim() || !password || saving}
          >
            {saving && <Spinner />}
            Tạo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
