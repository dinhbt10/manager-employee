import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type {
  Department,
  FeatureOption,
  LoginResponse,
  PermissionRequest,
  User,
  FeatureCode,
} from "@/api/types";
import { FeatureCodes } from "@/api/types";
import { useAuth } from "@/auth/AuthContext";
import { CellWithTooltip } from "@/components/CellWithTooltip";
import { ListSearchBar } from "@/components/ListSearchBar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApiErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import { Check, Eye, Pencil, Plus, Send, Trash2, XCircle } from "lucide-react";

function statusVariant(
  s: string,
): "default" | "success" | "warning" | "destructive" | "secondary" {
  switch (s) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warning";
    case "REJECTED":
    case "REVOKED":
      return "destructive";
    default:
      return "secondary";
  }
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    DRAFT: "Lưu nháp",
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    REVOKED: "Đã gỡ",
  };
  return m[s] ?? s;
}

function canApproveRequest(
  user: LoginResponse | null | undefined,
  r: PermissionRequest,
  hasFeature: (code: FeatureCode) => boolean,
): boolean {
  if (!user) return false;
  if (hasFeature(FeatureCodes.REQ_APPROVE_ALL)) return true;
  if (
    hasFeature(FeatureCodes.REQ_APPROVE_DEPT) &&
    user.departmentId != null &&
    r.targetDepartmentId != null &&
    r.targetDepartmentId === user.departmentId
  ) {
    return true;
  }
  return false;
}

function canDeleteRequest(
  user: LoginResponse | null | undefined,
  r: PermissionRequest,
): boolean {
  if (!user) return false;
  if (!["DRAFT", "REJECTED", "REVOKED"].includes(r.status)) return false;
  if (user.role === "ADMIN") return true;
  if (!user.userId) return false;
  if (r.requesterId === user.userId) return true;
  if (
    user.role === "MANAGER" &&
    user.departmentId != null &&
    r.targetDepartmentId != null &&
    r.targetDepartmentId === user.departmentId
  ) {
    return true;
  }
  return false;
}

function canEditRequest(
  user: LoginResponse | null | undefined,
  r: PermissionRequest,
): boolean {
  if (!user?.userId) return false;
  if (r.requesterId !== user.userId) return false;
  return ["DRAFT", "REJECTED", "REVOKED"].includes(r.status);
}

const TAB_STATUS_PARAMS: Record<"draft" | "pending" | "approved", string[]> = {
  draft: ["DRAFT", "REJECTED", "REVOKED"],
  pending: ["PENDING"],
  approved: ["APPROVED"],
};

type ReqApplied = {
  q: string;
  departmentId?: number;
  requesterId?: number;
  targetUserId?: number;
  createdFrom: string;
  createdTo: string;
  featureCode: string;
};

export function RequestsPage() {
  const { user, hasFeature } = useAuth();
  const [rows, setRows] = useState<PermissionRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [features, setFeatures] = useState<FeatureOption[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"draft" | "pending" | "approved">("pending");
  const [qInput, setQInput] = useState("");
  const [advOpen, setAdvOpen] = useState(false);
  const [advDept, setAdvDept] = useState<number | "">("");
  const [advReq, setAdvReq] = useState<number | "">("");
  const [advTarget, setAdvTarget] = useState<number | "">("");
  const [advFrom, setAdvFrom] = useState("");
  const [advTo, setAdvTo] = useState("");
  const [advFeat, setAdvFeat] = useState("");
  const [applied, setApplied] = useState<ReqApplied>({
    q: "",
    createdFrom: "",
    createdTo: "",
    featureCode: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | string[] | undefined> = {
        status: TAB_STATUS_PARAMS[tab],
      };
      if (applied.q.trim()) params.q = applied.q.trim();
      if (applied.departmentId != null)
        params.departmentId = applied.departmentId;
      if (applied.requesterId != null) params.requesterId = applied.requesterId;
      if (applied.targetUserId != null)
        params.targetUserId = applied.targetUserId;
      if (applied.createdFrom)
        params.createdFrom = new Date(applied.createdFrom).toISOString();
      if (applied.createdTo)
        params.createdTo = new Date(applied.createdTo).toISOString();
      if (applied.featureCode.trim())
        params.featureCode = applied.featureCode.trim();

      const [r, u, f] = await Promise.all([
        api.get<PermissionRequest[]>("/requests", { params }),
        api.get<User[]>("/users"),
        api.get<FeatureOption[]>("/features"),
      ]);
      setRows(r.data);
      setUsers(u.data);
      setFeatures(f.data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không tải được dữ liệu request"));
    } finally {
      setLoading(false);
    }
  }, [tab, applied]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    void api
      .get<Department[]>("/departments")
      .then((r) => setDepartments(r.data))
      .catch(() => {});
  }, [user?.role]);

  function applyQuick() {
    setApplied((prev) => ({ ...prev, q: qInput.trim() }));
  }

  function applyAdvanced() {
    setApplied({
      q: qInput.trim(),
      departmentId: advDept === "" ? undefined : advDept,
      requesterId: advReq === "" ? undefined : advReq,
      targetUserId: advTarget === "" ? undefined : advTarget,
      createdFrom: advFrom,
      createdTo: advTo,
      featureCode: advFeat,
    });
  }

  function hasAdvFilters(a: ReqApplied) {
    return (
      a.departmentId != null ||
      a.requesterId != null ||
      a.targetUserId != null ||
      !!a.createdFrom ||
      !!a.createdTo ||
      !!a.featureCode.trim()
    );
  }

  const emptyHint = useMemo(() => {
    const has = applied.q.trim() || hasAdvFilters(applied);
    return has ? "Không có request phù hợp bộ lọc." : "Không có dữ liệu.";
  }, [applied]);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Request cấp quyền"
        description="Tìm nhanh theo mã, tiêu đề, người liên quan, phòng ban. Tìm nâng cao: phòng, người tạo/đích, thời gian, mã chức năng."
        actions={
          <CreateRequestDialog
            users={users}
            features={features}
            onCreated={load}
          />
        }
      />

      <Card>
        <CardContent className="space-y-0 p-0 pt-6">
          <ListSearchBar
            q={qInput}
            onQChange={setQInput}
            onSearch={applyQuick}
            placeholder="Mã REQ, tiêu đề, người tạo, đối tượng, phòng ban…"
            advancedOpen={advOpen}
            onAdvancedOpenChange={(open) => {
              if (open) {
                setAdvDept(applied.departmentId ?? "");
                setAdvReq(applied.requesterId ?? "");
                setAdvTarget(applied.targetUserId ?? "");
                setAdvFrom(applied.createdFrom);
                setAdvTo(applied.createdTo);
                setAdvFeat(applied.featureCode);
              }
              setAdvOpen(open);
            }}
            onApplyAdvanced={applyAdvanced}
            advancedChildren={
              <div className="space-y-3">
                {user?.role === "ADMIN" && departments.length > 0 && (
                  <div>
                    <Label>Phòng ban (đối tượng)</Label>
                    <select
                      className={cn(
                        "mt-1 flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm",
                      )}
                      value={advDept === "" ? "" : String(advDept)}
                      onChange={(e) =>
                        setAdvDept(
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
                <div>
                  <Label>Người tạo request</Label>
                  <select
                    className={cn(
                      "mt-1 flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm",
                    )}
                    value={advReq === "" ? "" : String(advReq)}
                    onChange={(e) =>
                      setAdvReq(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                  >
                    <option value="">Tất cả</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Đối tượng được cấp</Label>
                  <select
                    className={cn(
                      "mt-1 flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm",
                    )}
                    value={advTarget === "" ? "" : String(advTarget)}
                    onChange={(e) =>
                      setAdvTarget(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                  >
                    <option value="">Tất cả</option>
                    {users.map((u) => (
                      <option key={`t-${u.id}`} value={u.id}>
                        {u.fullName} ({u.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Tạo từ</Label>
                    <Input
                      className="mt-1"
                      type="datetime-local"
                      value={advFrom}
                      onChange={(e) => setAdvFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Đến</Label>
                    <Input
                      className="mt-1"
                      type="datetime-local"
                      value={advTo}
                      onChange={(e) => setAdvTo(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Có mã chức năng</Label>
                  <select
                    className={cn(
                      "mt-1 flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm",
                    )}
                    value={advFeat}
                    onChange={(e) => setAdvFeat(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    {features.map((f) => (
                      <option key={f.code} value={f.code}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-zinc-600"
                  onClick={() => {
                    setAdvDept("");
                    setAdvReq("");
                    setAdvTarget("");
                    setAdvFrom("");
                    setAdvTo("");
                    setAdvFeat("");
                    setApplied((p) => ({
                      ...p,
                      q: qInput.trim(),
                      departmentId: undefined,
                      requesterId: undefined,
                      targetUserId: undefined,
                      createdFrom: "",
                      createdTo: "",
                      featureCode: "",
                    }));
                  }}
                >
                  Xóa bộ lọc nâng cao
                </Button>
              </div>
            }
          />

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as typeof tab)}
            className="px-6"
          >
            <TabsList className="grid h-11 w-full max-w-xl grid-cols-3 gap-1 p-1">
              <TabsTrigger value="draft">Đang soạn</TabsTrigger>
              <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
              <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            </TabsList>
            <TabsContent value="draft" className="mt-4">
              <RequestTable
                loading={loading}
                rows={rows}
                mode="draft"
                user={user}
                users={users}
                features={features}
                onAction={load}
                emptyMessage={emptyHint}
                hasFeature={hasFeature}
              />
            </TabsContent>
            <TabsContent value="pending" className="mt-4">
              <RequestTable
                loading={loading}
                rows={rows}
                mode="pending"
                user={user}
                users={users}
                features={features}
                onAction={load}
                emptyMessage={emptyHint}
                hasFeature={hasFeature}
              />
            </TabsContent>
            <TabsContent value="approved" className="mt-4">
              <RequestTable
                loading={loading}
                rows={rows}
                mode="approved"
                user={user}
                users={users}
                features={features}
                onAction={load}
                emptyMessage={emptyHint}
                hasFeature={hasFeature}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

type TableProps = {
  loading: boolean;
  rows: PermissionRequest[];
  mode: "draft" | "pending" | "approved";
  user: LoginResponse | null;
  users: User[];
  features: FeatureOption[];
  onAction: () => void;
  emptyMessage: string;
  hasFeature: (code: FeatureCode) => boolean;
};

function RequestTable({
  loading,
  rows,
  mode,
  user,
  users,
  features,
  onAction,
  emptyMessage,
  hasFeature,
}: TableProps) {
  const [rejectOpen, setRejectOpen] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [detail, setDetail] = useState<PermissionRequest | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PermissionRequest | null>(
    null,
  );
  const [confirmRevoke, setConfirmRevoke] = useState<PermissionRequest | null>(
    null,
  );

  async function submit(id: number) {
    try {
      await api.post(`/requests/${id}/submit`);
      toast.success("Đã gửi duyệt");
      onAction();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  async function approve(id: number) {
    try {
      await api.post(`/requests/${id}/approve`);
      toast.success("Phê duyệt thành công");
      onAction();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  async function reject(id: number) {
    setRejectSubmitting(true);
    try {
      await api.post(`/requests/${id}/reject`, { rejectReason });
      toast.success("Đã từ chối request");
      setRejectOpen(null);
      setRejectReason("");
      onAction();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setRejectSubmitting(false);
    }
  }

  async function revoke(id: number) {
    await api.post(`/requests/${id}/revoke`);
    toast.success("Đã gỡ quyền theo request");
    onAction();
  }

  async function del(id: number) {
    await api.delete(`/requests/${id}`);
    toast.success("Đã xóa request");
    onAction();
  }

  if (loading) {
    return <TableSkeleton rows={6} columns={5} />;
  }
  if (rows.length === 0) {
    return (
      <p className="px-6 pb-8 text-center text-sm text-zinc-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Mã</TableHead>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Đối tượng</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow
              key={r.id}
              className="cursor-pointer transition-colors"
              onDoubleClick={() => setDetail(r)}
            >
              <TableCell className="max-w-[100px] font-mono text-xs text-brand-300">
                <CellWithTooltip text={r.code} />
              </TableCell>
              <TableCell className="max-w-[220px]">
                <CellWithTooltip text={r.title} />
              </TableCell>
              <TableCell className="max-w-[200px] text-sm text-zinc-600">
                <CellWithTooltip
                  text={
                    r.targetDepartmentName
                      ? `${r.targetUserName} · ${r.targetDepartmentName}`
                      : r.targetUserName
                  }
                />
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(r.status)}>
                  {statusLabel(r.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-zinc-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetail(r);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Chi tiết
                  </Button>
                  {mode === "draft" && (
                    <>
                      {canEditRequest(user, r) && (
                        <span onClick={(e) => e.stopPropagation()}>
                          <EditRequestDialog
                            request={r}
                            users={users}
                            features={features}
                            onDone={onAction}
                          />
                        </span>
                      )}
                      {canEditRequest(user, r) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            void submit(r.id);
                          }}
                        >
                          <Send className="h-3 w-3" />
                          Gửi duyệt
                        </Button>
                      )}
                      {canDeleteRequest(user, r) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(r);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                          Xóa
                        </Button>
                      )}
                    </>
                  )}
                  {mode === "pending" &&
                    canApproveRequest(user, r, hasFeature) && (
                      <>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            void approve(r.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRejectOpen(r.id);
                          }}
                        >
                          <XCircle className="h-3 w-3" />
                          Từ chối
                        </Button>
                      </>
                    )}
                  {mode === "approved" &&
                    canApproveRequest(user, r, hasFeature) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmRevoke(r);
                        }}
                      >
                        Gỡ quyền
                      </Button>
                    )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <RequestDetailDialog
        request={detail}
        open={detail !== null}
        onOpenChange={(o) => !o && setDetail(null)}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Xóa request?"
        description={
          confirmDelete
            ? `Bạn có chắc muốn xóa "${confirmDelete.title}" (${confirmDelete.code})? Thao tác không thể hoàn tác.`
            : undefined
        }
        confirmLabel="Xóa"
        onConfirm={async () => {
          if (confirmDelete) await del(confirmDelete.id);
        }}
      />

      <ConfirmDialog
        open={confirmRevoke !== null}
        onOpenChange={(o) => !o && setConfirmRevoke(null)}
        title="Gỡ quyền đã cấp?"
        description={
          confirmRevoke
            ? `Request "${confirmRevoke.title}" sẽ chuyển sang trạng thái đã gỡ và quyền của nhân viên sẽ bị thu hồi.`
            : undefined
        }
        confirmLabel="Gỡ quyền"
        confirmVariant="default"
        onConfirm={async () => {
          if (confirmRevoke) await revoke(confirmRevoke.id);
        }}
      />

      <Dialog
        open={rejectOpen !== null}
        onOpenChange={() => setRejectOpen(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối request</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Lý do từ chối</Label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do rõ ràng…"
            />
            <Button
              className="w-full"
              variant="destructive"
              onClick={() => rejectOpen && void reject(rejectOpen)}
              disabled={!rejectReason.trim() || rejectSubmitting}
            >
              {rejectSubmitting && <Spinner />}
              Xác nhận từ chối
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RequestDetailDialog({
  request,
  open,
  onOpenChange,
}: {
  request: PermissionRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!request) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Chi tiết request — {request.code}
          </DialogTitle>
        </DialogHeader>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Tiêu đề
            </dt>
            <dd className="mt-0.5 text-zinc-900">{request.title}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Ghi chú
            </dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-zinc-700">
              {request.description ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Người tạo
            </dt>
            <dd className="mt-0.5 text-zinc-900">{request.requesterName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Đối tượng
            </dt>
            <dd className="mt-0.5 text-zinc-900">
              {request.targetUserName}
              {request.targetDepartmentName && (
                <span className="block text-xs text-zinc-500">
                  {request.targetDepartmentName}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Trạng thái
            </dt>
            <dd className="mt-1.5">
              <Badge variant={statusVariant(request.status)}>
                {statusLabel(request.status)}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Chức năng xin cấp
            </dt>
            <dd className="mt-1.5 flex flex-wrap gap-1">
              {[...request.requestedFeatureCodes].sort().map((c) => (
                <Badge
                  key={c}
                  variant="secondary"
                  className="font-mono text-[10px]"
                >
                  {c}
                </Badge>
              ))}
            </dd>
          </div>
          {request.reviewerName && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Người duyệt
              </dt>
              <dd className="mt-0.5 text-zinc-900">{request.reviewerName}</dd>
            </div>
          )}
          {request.rejectReason && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Lý do từ chối
              </dt>
              <dd className="mt-0.5 text-red-700">{request.rejectReason}</dd>
            </div>
          )}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function EditRequestDialog({
  request,
  users,
  features,
  onDone,
}: {
  request: PermissionRequest;
  users: User[];
  features: FeatureOption[];
  onDone: () => void;
}) {
  const { user: authUser } = useAuth();
  const isEmployee = authUser?.role === "EMPLOYEE";
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description ?? "");
  const [targetUserId, setTargetUserId] = useState<number>(
    request.targetUserId,
  );
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(request.requestedFeatureCodes),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(request.title);
    setDescription(request.description ?? "");
    setTargetUserId(request.targetUserId);
    setSelected(new Set(request.requestedFeatureCodes));
  }, [request]);

  const featureOptions = useMemo(() => {
    const byCode = new Map(features.map((f) => [f.code, f]));
    for (const code of request.requestedFeatureCodes) {
      if (!byCode.has(code)) {
        byCode.set(code, { code, name: `${code} (đã ngưng)` });
      }
    }
    return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
  }, [features, request.requestedFeatureCodes]);

  function toggleFeat(code: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });
  }

  async function save() {
    if (!title.trim() || selected.size === 0) return;
    setSaving(true);
    try {
      const activeCodes = new Set(features.map((f) => f.code));
      const requestedFeatureCodes = [...selected].filter((code) =>
        activeCodes.has(code),
      );
      const droppedInactive = [...selected].filter(
        (code) => !activeCodes.has(code),
      );
      if (droppedInactive.length > 0) {
        toast.info(`Đã gỡ ${droppedInactive.length} mã đã ngưng khỏi request.`);
      }
      if (requestedFeatureCodes.length === 0) {
        toast.error("Cần ít nhất một chức năng đang hoạt động.");
        setSaving(false);
        return;
      }
      await api.patch(`/requests/${request.id}`, {
        title: title.trim(),
        description: description.trim() || null,
        targetUserId,
        requestedFeatureCodes,
      });
      toast.success("Đã cập nhật request");
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
          variant="outline"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil className="h-3 w-3" />
          Sửa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa request</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tiêu đề</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
            />
          </div>
          <div>
            <Label>Ghi chú</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label>Áp dụng cho nhân viên</Label>
            {isEmployee && (
              <p className="mt-1 text-xs text-zinc-500">
                Bạn chỉ có thể xin quyền cho chính mình.
              </p>
            )}
            <select
              className={cn(
                "mt-1 flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm",
                isEmployee && "cursor-not-allowed opacity-90",
              )}
              value={String(targetUserId)}
              onChange={(e) => setTargetUserId(Number(e.target.value))}
              disabled={isEmployee}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.employeeCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Chức năng (multi-select)</Label>
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/50 p-3">
              {featureOptions.map((f) => (
                <label
                  key={f.code}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(f.code)}
                    onChange={() => toggleFeat(f.code)}
                    className="rounded border-zinc-300"
                  />
                  <span className="text-zinc-800">{f.name}</span>
                  <span className="font-mono text-xs text-zinc-500">
                    {f.code}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => void save()}
            disabled={!title.trim() || selected.size === 0 || saving}
          >
            {saving && <Spinner />}
            Lưu thay đổi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateRequestDialog({
  users,
  features,
  onCreated,
}: {
  users: User[];
  features: FeatureOption[];
  onCreated: () => void;
}) {
  const { user: authUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetUserId, setTargetUserId] = useState<number | "">("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const isEmployee = authUser?.role === "EMPLOYEE";

  useEffect(() => {
    if (!open || !isEmployee) return;
    const selfId = authUser?.userId ?? users[0]?.id;
    if (selfId != null) {
      setTargetUserId(selfId);
    }
  }, [open, isEmployee, authUser?.userId, users]);

  function toggleFeat(code: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });
  }

  async function create() {
    if (!title.trim() || targetUserId === "" || selected.size === 0) return;
    setSaving(true);
    try {
      await api.post("/requests", {
        title: title.trim(),
        description: description.trim() || null,
        targetUserId,
        requestedFeatureCodes: [...selected],
      });
      toast.success("Đã tạo request (nháp)");
      setOpen(false);
      onCreated();
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
          setTitle("");
          setDescription("");
          setTargetUserId("");
          setSelected(new Set());
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Tạo request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo request cấp quyền</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tiêu đề</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Xin cấp quyền xem NV phòng"
              maxLength={255}
            />
          </div>
          <div>
            <Label>Ghi chú</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label>Áp dụng cho nhân viên</Label>
            {isEmployee && (
              <p className="mt-1 text-xs text-zinc-500">
                Mặc định là tài khoản của bạn (xin quyền cho chính mình).
              </p>
            )}
            <select
              className={cn(
                "mt-1 flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm",
                isEmployee && "cursor-not-allowed opacity-90",
              )}
              value={targetUserId === "" ? "" : String(targetUserId)}
              onChange={(e) =>
                setTargetUserId(e.target.value ? Number(e.target.value) : "")
              }
              disabled={isEmployee}
            >
              {!isEmployee && <option value="">— Chọn —</option>}
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.employeeCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Chức năng (multi-select)</Label>
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/50 p-3">
              {features.map((f) => (
                <label
                  key={f.code}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(f.code)}
                    onChange={() => toggleFeat(f.code)}
                    className="rounded border-zinc-300"
                  />
                  <span className="text-zinc-800">{f.name}</span>
                  <span className="font-mono text-xs text-zinc-500">
                    {f.code}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => void create()}
            disabled={
              !title.trim() ||
              targetUserId === "" ||
              selected.size === 0 ||
              saving
            }
          >
            {saving && <Spinner />}
            Lưu nháp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
