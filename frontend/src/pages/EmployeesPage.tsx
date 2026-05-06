import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { Department, FeatureOption, Role, User } from "@/api/types";
import { FeatureCodes } from "@/api/types";
import { useAuth, roleLabel } from "@/auth/AuthContext";
import { CellWithTooltip } from "@/components/CellWithTooltip";
import { ListSearchBar } from "@/components/ListSearchBar";
import { Pagination } from "@/components/Pagination";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import { Eye, Pencil, UserPlus, Download, Key } from "lucide-react";

/**
 * ADMIN / MANAGER có quyền theo vai trò (AccessPolicy) dù `user.features` từ DB có thể rỗng.
 * Chỉ EMPLOYEE (và trường hợp có gán thêm) mới hiển thị đúng danh sách mã trong `user_features`.
 */
function permissionBadges(user: User, labelByCode: Map<string, string>) {
  if (user.role === "ADMIN") {
    return (
      <Badge
        key="admin-all"
        variant="default"
        className="bg-zinc-900 text-white hover:bg-zinc-900"
      >
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
    <Badge key={c} variant="secondary" className="text-xs">
      {labelByCode.get(c) ?? c}
    </Badge>
  ));
}

function permissionTooltip(user: User, labelByCode: Map<string, string>): string {
  if (user.role === "ADMIN") {
    return "Quản trị viên — toàn quyền (không cần gán từng chức năng trong DB)";
  }
  if (user.role === "MANAGER" && user.features.length === 0) {
    return "Quản lý — đủ quyền với nhân viên thuộc phòng ban của mình";
  }
  const labels = user.features.map((c) => labelByCode.get(c) ?? c);
  return labels.join(", ") || "Chỉ xem (chưa cấp chức năng)";
}

export function EmployeesPage() {
  const { hasFeature, user: currentUser } = useAuth();
  const [rows, setRows] = useState<User[]>([]);
  const [features, setFeatures] = useState<FeatureOption[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [exporting, setExporting] = useState(false);

  const isAdmin = currentUser?.role === "ADMIN";
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [qInput, setQInput] = useState("");
  const [advOpen, setAdvOpen] = useState(false);
  const [advRole, setAdvRole] = useState<"" | Role>("");
  const [advDeptId, setAdvDeptId] = useState<number | "">("");
  const [applied, setApplied] = useState<{
    q: string;
    role: string;
    departmentId?: number;
  }>({
    q: "",
    role: "",
  });

  const featureLabelByCode = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of features) m.set(f.code, f.name);
    return m;
  }, [features]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (applied.q.trim()) params.q = applied.q.trim();
      if (applied.role) params.role = applied.role;
      if (applied.departmentId != null)
        params.departmentId = applied.departmentId;

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
    if (!hasFeature(FeatureCodes.EMP_CREATE)) return;
    void api
      .get<Department[]>("/departments/options")
      .then((r) => setDepartments(r.data))
      .catch(() => {});
  }, [hasFeature]);

  function applyQuickSearch() {
    setApplied((prev) => ({ ...prev, q: qInput.trim() }));
    setCurrentPage(1);
  }

  function applyAdvancedSearch() {
    setApplied({
      q: qInput.trim(),
      role: advRole,
      departmentId: advDeptId === "" ? undefined : advDeptId,
    });
    setCurrentPage(1);
  }

  // Pagination logic
  const totalItems = rows.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRows = rows.slice(startIndex, endIndex);

  async function exportToExcel() {
    if (!hasFeature(FeatureCodes.EMP_EXPORT)) {
      toast.error("Không có quyền xuất Excel");
      return;
    }
    
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (applied.q.trim()) params.append("q", applied.q.trim());
      if (applied.role) params.append("role", applied.role);
      if (applied.departmentId != null) params.append("departmentId", String(applied.departmentId));

      const response = await api.get("/users/export", {
        params,
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "danh-sach-nhan-vien.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Đã xuất file Excel thành công");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không thể xuất Excel"));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Nhân viên"
        description="Danh sách theo phân quyền: Admin toàn hệ thống; Quản lý theo phòng; NV chỉ thấy hồ sơ của mình."
        actions={
          <div className="flex gap-2">
            {hasFeature(FeatureCodes.EMP_EXPORT) && (
              <Button
                variant="secondary"
                onClick={() => void exportToExcel()}
                disabled={exporting}
              >
                {exporting ? <Spinner /> : <Download className="h-4 w-4" />}
                Xuất Excel
              </Button>
            )}
            {hasFeature(FeatureCodes.EMP_CREATE) && (
              <CreateUserDialog
                departments={departments}
                features={features}
                onDone={load}
              />
            )}
          </div>
        }
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
                      "mt-1 flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm",
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
                {hasFeature(FeatureCodes.EMP_VIEW_ALL) && (
                  <div>
                    <Label>Phòng ban</Label>
                    <select
                      className={cn(
                        "mt-1 flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm",
                      )}
                      value={advDeptId === "" ? "" : String(advDeptId)}
                      onChange={(e) =>
                        setAdvDeptId(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
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
                    setApplied({
                      q: qInput.trim(),
                      role: "",
                      departmentId: undefined,
                    });
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
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Ngày sinh</TableHead>
                  <TableHead>CCCD</TableHead>
                  <TableHead>Quyền</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.map((u) => (
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
                    <TableCell className="text-zinc-600">
                      {u.gender || "—"}
                    </TableCell>
                    <TableCell className="text-zinc-600 text-xs">
                      {u.dateOfBirth || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-600">
                      {u.citizenId || "—"}
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <div
                        className="flex flex-wrap gap-1"
                        title={permissionTooltip(u, featureLabelByCode)}
                      >
                        {permissionBadges(u, featureLabelByCode)}
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
                        {isAdmin && (
                          <EditCredentialsDialog user={u} onDone={load} />
                        )}
                        {hasFeature(FeatureCodes.EMP_EDIT_DEPT) && !isAdmin && (
                          <ManagerEditEmployeeDialog user={u} onDone={load} />
                        )}
                        {isAdmin && (
                          <EditUserDialog
                            user={u}
                            features={features}
                            onDone={load}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && rows.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          )}
        </CardContent>
      </Card>

      <EmployeeDetailDialog
        user={detailUser}
        open={detailUser !== null}
        onOpenChange={(o) => !o && setDetailUser(null)}
        featureLabelByCode={featureLabelByCode}
      />
    </div>
  );
}

function EmployeeDetailDialog({
  user,
  open,
  onOpenChange,
  featureLabelByCode,
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureLabelByCode: Map<string, string>;
}) {
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Chi tiết nhân viên</DialogTitle>
        </DialogHeader>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Mã NV
            </dt>
            <dd className="mt-0.5 font-mono text-zinc-900">
              {user.employeeCode}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Họ tên
            </dt>
            <dd className="mt-0.5 text-zinc-900">{user.fullName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Username
            </dt>
            <dd className="mt-0.5 font-mono text-zinc-900">{user.username}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Vai trò
            </dt>
            <dd className="mt-0.5 text-zinc-900">{roleLabel(user.role)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Phòng ban
            </dt>
            <dd className="mt-0.5 text-zinc-900">
              {user.departmentName ?? "—"}
            </dd>
          </div>
          {user.gender && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Giới tính
              </dt>
              <dd className="mt-0.5 text-zinc-900">{user.gender}</dd>
            </div>
          )}
          {user.dateOfBirth && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Ngày sinh
              </dt>
              <dd className="mt-0.5 text-zinc-900">{user.dateOfBirth}</dd>
            </div>
          )}
          {user.address && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Địa chỉ
              </dt>
              <dd className="mt-0.5 text-zinc-900">{user.address}</dd>
            </div>
          )}
          {user.nationality && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Quốc tịch
              </dt>
              <dd className="mt-0.5 text-zinc-900">{user.nationality}</dd>
            </div>
          )}
          {user.citizenId && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                CCCD
              </dt>
              <dd className="mt-0.5 font-mono text-zinc-900">{user.citizenId}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Chức năng đã cấp
            </dt>
            <dd className="mt-1.5 flex flex-wrap gap-1">
              {permissionBadges(user, featureLabelByCode)}
            </dd>
          </div>
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function ManagerEditEmployeeDialog({
  user,
  onDone,
}: {
  user: User;
  onDone: () => void;
}) {
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
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => e.stopPropagation()}
        >
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
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => void save()}
            disabled={!fullName.trim() || saving}
          >
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
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(user.features),
  );
  const [gender, setGender] = useState(user.gender || "");
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth || "");
  const [address, setAddress] = useState(user.address || "");
  const [nationality, setNationality] = useState(user.nationality || "");
  const [citizenId, setCitizenId] = useState(user.citizenId || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(user.fullName);
    setSelected(new Set(user.features));
    setGender(user.gender || "");
    setDateOfBirth(user.dateOfBirth || "");
    setAddress(user.address || "");
    setNationality(user.nationality || "");
    setCitizenId(user.citizenId || "");
  }, [user.features, user.fullName, user.id, user.gender, user.dateOfBirth, user.address, user.nationality, user.citizenId]);

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
        await api.patch(`/users/${user.id}`, { 
          fullName: fullName.trim(),
          gender: gender || null,
          dateOfBirth: dateOfBirth || null,
          address: address.trim() || null,
          nationality: nationality.trim() || null,
          citizenId: citizenId.trim() || null,
        });
        toast.success("Đã cập nhật nhân viên");
      } else {
        const activeCodes = new Set(features.map((f) => f.code));
        const featureCodes = [...selected].filter((code) =>
          activeCodes.has(code),
        );
        const droppedInactive = [...selected].filter(
          (code) => !activeCodes.has(code),
        );
        if (droppedInactive.length > 0) {
          toast.info(
            `Đã gỡ ${droppedInactive.length} mã đã ngưng khỏi phân quyền.`,
          );
        }
        await api.patch(`/users/${user.id}`, {
          fullName: fullName.trim(),
          featureCodes,
          gender: gender || null,
          dateOfBirth: dateOfBirth || null,
          address: address.trim() || null,
          nationality: nationality.trim() || null,
          citizenId: citizenId.trim() || null,
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
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => e.stopPropagation()}
        >
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
              Quản trị viên có <strong>toàn quyền hệ thống</strong> theo code
              (không cần gán từng chức năng trong DB). Chỉnh họ tên bên dưới nếu
              cần.
            </>
          ) : (
            <>
              Chỉnh sửa thông tin cá nhân của nhân viên.
            </>
          )}
        </p>
        <div className="space-y-3">
          <div>
            <Label>Họ tên</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div className="border-t pt-3">
            <p className="mb-2 text-sm font-medium text-zinc-700">Thông tin cá nhân</p>
            <div className="space-y-3">
              <div>
                <Label>Giới tính</Label>
                <select
                  className={cn(
                    "flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm",
                  )}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">— Chọn —</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <Label>Ngày sinh</Label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div>
                <Label>Địa chỉ</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, đường, phường, quận, thành phố"
                />
              </div>
              <div>
                <Label>Quốc tịch</Label>
                <Input
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="Việt Nam"
                />
              </div>
              <div>
                <Label>CCCD</Label>
                <Input
                  value={citizenId}
                  onChange={(e) => setCitizenId(e.target.value)}
                  placeholder="Số căn cước công dân"
                />
              </div>
            </div>
          </div>

        </div>
        <Button
          className="w-full"
          onClick={() => void save()}
          disabled={!fullName.trim() || saving}
        >
          {saving && <Spinner />}
          Lưu
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function EditCredentialsDialog({
  user,
  onDone,
}: {
  user: User;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsername(user.username);
    setPassword("");
  }, [user.username, user.id]);

  async function save() {
    if (!username.trim() && !password.trim()) {
      toast.error("Vui lòng nhập username hoặc password mới");
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/users/${user.id}/credentials`, {
        username: username.trim() || undefined,
        password: password || undefined,
      });
      toast.success("Đã cập nhật tài khoản");
      setOpen(false);
      setPassword("");
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
        <Button
          size="sm"
          variant="outline"
          className="border-amber-200 text-amber-700 hover:bg-amber-50"
          onClick={(e) => e.stopPropagation()}
        >
          <Key className="h-3 w-3" />
          Tài khoản
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi tài khoản — {user.fullName}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-zinc-500">
          Chỉ Admin mới có quyền đổi username/password. Để trống nếu không muốn đổi.
        </p>
        <div className="space-y-3">
          <div>
            <Label>Username hiện tại</Label>
            <div className="mt-1 rounded-lg bg-zinc-100 px-3 py-2 font-mono text-sm text-zinc-600">
              {user.username}
            </div>
          </div>
          <div>
            <Label>Username mới (để trống nếu không đổi)</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username mới"
            />
          </div>
          <div>
            <Label>Password mới (để trống nếu không đổi)</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập password mới"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving && <Spinner />}
            Lưu thay đổi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateUserDialog({
  departments,
  features,
  onDone,
}: {
  departments: Department[];
  features: FeatureOption[];
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"EMPLOYEE" | "MANAGER">("EMPLOYEE");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [nationality, setNationality] = useState("");
  const [citizenId, setCitizenId] = useState("");
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
        departmentId,
        featureCodes: [...selected],
        gender: gender.trim() || null,
        dateOfBirth: dateOfBirth || null,
        address: address.trim() || null,
        nationality: nationality.trim() || null,
        citizenId: citizenId.trim() || null,
      });
      toast.success("Đã tạo nhân viên mới");
      setOpen(false);
      setFullName("");
      setUsername("");
      setPassword("");
      setDepartmentId("");
      setSelected(new Set());
      setGender("");
      setDateOfBirth("");
      setAddress("");
      setNationality("");
      setCitizenId("");
      onDone();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setFullName("");
          setUsername("");
          setPassword("");
          setRole("EMPLOYEE");
          setDepartmentId("");
          setSelected(new Set());
          setGender("");
          setDateOfBirth("");
          setAddress("");
          setNationality("");
          setCitizenId("");
        }
      }}
    >
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
            <Label>Họ tên *</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <Label>Username *</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <Label>Mật khẩu *</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>Vai trò *</Label>
            <select
              className={cn(
                "flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm",
              )}
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "EMPLOYEE" | "MANAGER")
              }
            >
              <option value="EMPLOYEE">Nhân viên</option>
              <option value="MANAGER">Quản lý</option>
            </select>
          </div>
          <div>
            <Label>Phòng ban *</Label>
            <select
              className={cn(
                "flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm",
              )}
              value={departmentId === "" ? "" : String(departmentId)}
              onChange={(e) =>
                setDepartmentId(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              required
            >
              <option value="">— Chọn phòng ban —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {departments.length === 0 && (
              <p className="mt-1 text-xs text-amber-700">
                Chưa có phòng ban trong hệ thống. Hãy tạo phòng ban trước.
              </p>
            )}
          </div>
          
          <div className="border-t pt-3">
            <p className="mb-2 text-sm font-medium text-zinc-700">Thông tin cá nhân (tùy chọn)</p>
            <div className="space-y-3">
              <div>
                <Label>Giới tính</Label>
                <select
                  className={cn(
                    "flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm",
                  )}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">— Chọn —</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <Label>Ngày sinh</Label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div>
                <Label>Địa chỉ</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, đường, phường, quận, thành phố"
                />
              </div>
              <div>
                <Label>Quốc tịch</Label>
                <Input
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="Việt Nam"
                />
              </div>
              <div>
                <Label>CCCD</Label>
                <Input
                  value={citizenId}
                  onChange={(e) => setCitizenId(e.target.value)}
                  placeholder="Số căn cước công dân"
                />
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => void save()}
            disabled={
              !fullName.trim() ||
              !username.trim() ||
              !password ||
              departmentId === "" ||
              saving
            }
          >
            {saving && <Spinner />}
            Tạo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
