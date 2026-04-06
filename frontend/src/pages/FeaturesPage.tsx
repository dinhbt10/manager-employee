import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { FeatureAdmin } from "@/api/types";
import { CellWithTooltip } from "@/components/CellWithTooltip";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
import { Eye, Layers, Pencil, Plus } from "lucide-react";

export function FeaturesPage() {
  const [rows, setRows] = useState<FeatureAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [qInput, setQInput] = useState("");
  const [advOpen, setAdvOpen] = useState(false);
  const [advActive, setAdvActive] = useState<"" | "active" | "inactive">("");
  const [applied, setApplied] = useState<{ q: string; active?: boolean }>({ q: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | boolean> = {};
      if (applied.q.trim()) params.q = applied.q.trim();
      if (applied.active !== undefined) params.active = applied.active;
      const r = await api.get<FeatureAdmin[]>("/features/catalog", { params });
      setRows(r.data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không tải được danh mục chức năng"));
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyQuick() {
    setApplied((prev) => ({ ...prev, q: qInput.trim() }));
  }

  function applyAdvanced() {
    setApplied({
      q: qInput.trim(),
      active: advActive === "" ? undefined : advActive === "active",
    });
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Chức năng (mã)"
        description="Danh mục mã chức năng dùng cho phân quyền và request — chỉ Admin. Mã không đổi sau khi tạo; có thể đổi tên hiển thị và ngưng hoạt động."
        actions={<CreateFeatureDialog onDone={load} />}
      />
      <Card>
        <CardContent className="space-y-0 p-0 pt-6">
          <ListSearchBar
            q={qInput}
            onQChange={setQInput}
            onSearch={applyQuick}
            placeholder="Mã, tên chức năng…"
            advancedOpen={advOpen}
            onAdvancedOpenChange={(open) => {
              if (open) {
                if (applied.active === undefined) setAdvActive("");
                else setAdvActive(applied.active ? "active" : "inactive");
              }
              setAdvOpen(open);
            }}
            onApplyAdvanced={applyAdvanced}
            advancedChildren={
              <div>
                <Label>Trạng thái</Label>
                <select
                  className={cn(
                    "mt-1 flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm"
                  )}
                  value={advActive}
                  onChange={(e) => setAdvActive(e.target.value as "" | "active" | "inactive")}
                >
                  <option value="">Tất cả</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngưng</option>
                </select>
              </div>
            }
          />
          {loading ? (
            <TableSkeleton rows={8} columns={4} />
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500">
              {applied.q || applied.active !== undefined
                ? "Không có chức năng phù hợp bộ lọc."
                : "Chưa có chức năng."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên hiển thị</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((f) => (
                  <TableRow key={f.id} className="transition-colors">
                    <TableCell className="max-w-[200px] font-mono text-xs text-brand-800">
                      <CellWithTooltip text={f.code} />
                    </TableCell>
                    <TableCell className="max-w-[320px]">
                      <CellWithTooltip text={f.name} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={f.active ? "success" : "destructive"}>
                        {f.active ? "Hoạt động" : "Ngưng"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <FeatureDetailDialog feature={f} />
                        <EditFeatureDialog feature={f} onDone={load} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureDetailDialog({ feature: f }: { feature: FeatureAdmin }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-zinc-700">
          <Eye className="h-3.5 w-3.5" />
          Chi tiết
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chi tiết chức năng</DialogTitle>
        </DialogHeader>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Mã</dt>
            <dd className="mt-0.5 font-mono text-brand-800">{f.code}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Tên</dt>
            <dd className="mt-0.5 text-zinc-900">{f.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Trạng thái</dt>
            <dd className="mt-1.5">
              <Badge variant={f.active ? "success" : "destructive"}>
                {f.active ? "Hoạt động" : "Ngưng"}
              </Badge>
            </dd>
          </div>
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function EditFeatureDialog({ feature, onDone }: { feature: FeatureAdmin; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(feature.name);
  const [active, setActive] = useState(feature.active);
  const [saving, setSaving] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  useEffect(() => {
    setName(feature.name);
    setActive(feature.active);
  }, [feature]);

  async function doSave() {
    setSaving(true);
    try {
      await api.patch(`/features/catalog/${feature.id}`, { name: name.trim(), active });
      toast.success("Đã cập nhật chức năng");
      setOpen(false);
      setConfirmDeactivate(false);
      onDone();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function save() {
    if (!name.trim()) return;
    if (feature.active && !active) {
      setConfirmDeactivate(true);
      return;
    }
    void doSave();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="secondary">
            <Pencil className="h-3 w-3" />
            Sửa
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa chức năng — {feature.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên hiển thị</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="size-4 rounded border-zinc-300"
              />
              <span className="text-sm text-zinc-800">Đang hoạt động (hiện trong danh sách gán quyền)</span>
            </label>
            <Button className="w-full" onClick={() => void save()} disabled={!name.trim() || saving}>
              {saving && <Spinner />}
              Lưu thay đổi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title="Ngưng chức năng?"
        description="Chức năng ngưng sẽ không còn trong dropdown gán quyền; người dùng không còn quyền từ mã này cho đến khi bật lại."
        confirmLabel="Ngưng"
        onConfirm={() => doSave()}
      />
    </>
  );
}

function CreateFeatureDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const c = code.trim();
    const n = name.trim();
    if (!c || !n) return;
    setSaving(true);
    try {
      await api.post("/features/catalog", { code: c, name: n });
      toast.success("Đã thêm chức năng");
      setOpen(false);
      setCode("");
      setName("");
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
          <Plus className="h-4 w-4" />
          Thêm chức năng
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-teal-600" />
            Chức năng mới
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Mã (không đổi sau khi tạo)</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VD: EMP_REPORT"
              className="mt-1 font-mono"
            />
            <p className="mt-1 text-xs text-zinc-500">Chữ cái đầu, sau đó chữ số hoặc gạch dưới (2–64 ký tự).</p>
          </div>
          <div>
            <Label>Tên hiển thị</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Báo cáo nhân viên" />
          </div>
          <Button
            className="w-full"
            onClick={() => void save()}
            disabled={!code.trim() || !name.trim() || saving}
          >
            {saving && <Spinner />}
            Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
