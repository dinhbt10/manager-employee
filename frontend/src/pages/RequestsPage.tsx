import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/api/client";
import type { FeatureOption, PermissionRequest, User } from "@/api/types";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Check, Plus, Send, XCircle } from "lucide-react";

function statusVariant(s: string): "default" | "success" | "warning" | "destructive" | "secondary" {
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
    DRAFT: "Nháp",
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    REVOKED: "Đã gỡ",
  };
  return m[s] ?? s;
}

export function RequestsPage() {
  const [rows, setRows] = useState<PermissionRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [features, setFeatures] = useState<FeatureOption[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, u, f] = await Promise.all([
        api.get<PermissionRequest[]>("/requests"),
        api.get<User[]>("/users"),
        api.get<FeatureOption[]>("/features"),
      ]);
      setRows(r.data);
      setUsers(u.data);
      setFeatures(f.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const draft = useMemo(
    () => rows.filter((x) => ["DRAFT", "REJECTED", "REVOKED"].includes(x.status)),
    [rows]
  );
  const pending = useMemo(() => rows.filter((x) => x.status === "PENDING"), [rows]);
  const approved = useMemo(() => rows.filter((x) => x.status === "APPROVED"), [rows]);

  return (
    <div>
      <PageHeader
        title="Request cấp quyền"
        description="Luồng chính: tạo yêu cầu, gửi duyệt, Admin hoặc Quản lý phòng duyệt trong phạm vi phòng ban."
        actions={
          <CreateRequestDialog users={users} features={features} onCreated={load} />
        }
      />

      <Card className="border-white/10">
        <CardContent className="p-0 pt-6">
          <Tabs defaultValue="pending" className="px-6">
            <TabsList className="grid w-full max-w-xl grid-cols-3">
              <TabsTrigger value="draft">Đang soạn / Từ chối</TabsTrigger>
              <TabsTrigger value="pending">Chờ phê duyệt</TabsTrigger>
              <TabsTrigger value="approved">Đã phê duyệt</TabsTrigger>
            </TabsList>
            <TabsContent value="draft">
              <RequestTable loading={loading} rows={draft} mode="draft" onAction={load} />
            </TabsContent>
            <TabsContent value="pending">
              <RequestTable loading={loading} rows={pending} mode="pending" onAction={load} />
            </TabsContent>
            <TabsContent value="approved">
              <RequestTable loading={loading} rows={approved} mode="approved" onAction={load} />
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
  onAction: () => void;
  currentUserId?: number;
};

function RequestTable({ loading, rows, mode, onAction }: TableProps) {
  const [rejectOpen, setRejectOpen] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function submit(id: number) {
    await api.post(`/requests/${id}/submit`);
    onAction();
  }

  async function approve(id: number) {
    await api.post(`/requests/${id}/approve`);
    onAction();
  }

  async function reject(id: number) {
    await api.post(`/requests/${id}/reject`, { rejectReason });
    setRejectOpen(null);
    setRejectReason("");
    onAction();
  }

  async function revoke(id: number) {
    await api.post(`/requests/${id}/revoke`);
    onAction();
  }

  async function del(id: number) {
    await api.delete(`/requests/${id}`);
    onAction();
  }

  if (loading) {
    return <p className="p-6 text-zinc-500">Đang tải…</p>;
  }
  if (rows.length === 0) {
    return <p className="p-6 text-zinc-500">Không có dữ liệu.</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã</TableHead>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Đối tượng</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs text-brand-300">{r.code}</TableCell>
              <TableCell className="max-w-[200px] truncate">{r.title}</TableCell>
              <TableCell className="text-sm text-zinc-400">
                {r.targetUserName}
                {r.targetDepartmentName && (
                  <span className="block text-xs text-zinc-500">{r.targetDepartmentName}</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(r.status)}>{statusLabel(r.status)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {mode === "draft" && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => void submit(r.id)}>
                        <Send className="h-3 w-3" />
                        Gửi duyệt
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400" onClick={() => void del(r.id)}>
                        Xóa
                      </Button>
                    </>
                  )}
                  {mode === "pending" && (
                    <>
                      <Button size="sm" onClick={() => void approve(r.id)}>
                        <Check className="h-3 w-3" />
                        Duyệt
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setRejectOpen(r.id)}>
                        <XCircle className="h-3 w-3" />
                        Từ chối
                      </Button>
                    </>
                  )}
                  {mode === "approved" && (
                    <Button size="sm" variant="outline" onClick={() => void revoke(r.id)}>
                      Gỡ quyền
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={rejectOpen !== null} onOpenChange={() => setRejectOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lý do từ chối</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nội dung</Label>
            <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            <Button
              className="w-full"
              onClick={() => rejectOpen && void reject(rejectOpen)}
              disabled={!rejectReason.trim()}
            >
              Xác nhận từ chối
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetUserId, setTargetUserId] = useState<number | "">("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
    await api.post("/requests", {
      title: title.trim(),
      description: description.trim() || null,
      targetUserId,
      requestedFeatureCodes: [...selected],
    });
    setOpen(false);
    setTitle("");
    setDescription("");
    setTargetUserId("");
    setSelected(new Set());
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Xin cấp quyền xem NV phòng" />
          </div>
          <div>
            <Label>Ghi chú</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Áp dụng cho nhân viên</Label>
            <select
              className={cn(
                "flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white"
              )}
              value={targetUserId === "" ? "" : String(targetUserId)}
              onChange={(e) => setTargetUserId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">— Chọn —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.employeeCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Chức năng (multi-select)</Label>
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-white/10 p-3">
              {features.map((f) => (
                <label key={f.code} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.has(f.code)}
                    onChange={() => toggleFeat(f.code)}
                    className="rounded border-white/20"
                  />
                  <span className="text-zinc-200">{f.name}</span>
                  <span className="font-mono text-xs text-zinc-500">{f.code}</span>
                </label>
              ))}
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => void create()}
            disabled={!title.trim() || targetUserId === "" || selected.size === 0}
          >
            Lưu nháp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
