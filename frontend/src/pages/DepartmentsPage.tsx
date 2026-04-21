import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { Department } from "@/api/types";
import { FeatureCodes } from "@/api/types";
import { useAuth } from "@/auth/AuthContext";
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
import { Building2, Eye, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export function DepartmentsPage() {
  const { hasFeature } = useAuth();
  const [rows, setRows] = useState<Department[]>([]);
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
      const r = await api.get<Department[]>("/departments", { params });
      setRows(r.data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không tải được danh sách phòng ban"));
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
        title="Phòng ban"
        description="Quản lý danh mục phòng ban — tạo mới, cập nhật tên và trạng thái hoạt động."
        actions={
          hasFeature(FeatureCodes.DEPT_CREATE) ? (
            <CreateDepartmentDialog onDone={load} />
          ) : null
        }
      />
      <Card>
        <CardContent className="space-y-0 p-0 pt-6">
          <ListSearchBar
            q={qInput}
            onQChange={setQInput}
            onSearch={applyQuick}
            placeholder="Mã, tên phòng ban…"
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
            <TableSkeleton rows={6} columns={4} />
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500">
              {applied.q || applied.active !== undefined
                ? "Không có phòng ban phù hợp bộ lọc."
                : "Chưa có phòng ban."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên phòng ban</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={d.id} className="transition-colors">
                    <TableCell className="max-w-[120px] font-mono text-xs text-brand-300">
                      <CellWithTooltip text={d.code} />
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <CellWithTooltip text={d.name} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.active ? "success" : "destructive"}>
                        {d.active ? "Hoạt động" : "Ngưng"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <DepartmentDetailDialog department={d} />
                        {hasFeature(FeatureCodes.DEPT_EDIT) && (
                          <EditDepartmentDialog department={d} onDone={load} />
                        )}
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

function DepartmentDetailDialog({ department: d }: { department: Department }) {
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
          <DialogTitle>Chi tiết phòng ban</DialogTitle>
        </DialogHeader>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Mã</dt>
            <dd className="mt-0.5 font-mono text-brand-300">{d.code}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Tên</dt>
            <dd className="mt-0.5 text-zinc-900">{d.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Trạng thái</dt>
            <dd className="mt-1.5">
              <Badge variant={d.active ? "success" : "destructive"}>
                {d.active ? "Hoạt động" : "Ngưng"}
              </Badge>
            </dd>
          </div>
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function EditDepartmentDialog({ department, onDone }: { department: Department; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(department.name);
  const [active, setActive] = useState(department.active);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(department.name);
    setActive(department.active);
  }, [department]);

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/departments/${department.id}`, { name: name.trim(), active });
      toast.success("Đã cập nhật phòng ban");
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
        <Button size="sm" variant="secondary">
          <Pencil className="h-3 w-3" />
          Sửa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa phòng ban — {department.code}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tên phòng ban</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 rounded border-zinc-300"
            />
            <span className="text-sm text-zinc-800">Đang hoạt động</span>
          </label>
          <Button className="w-full" onClick={() => void save()} disabled={!name.trim() || saving}>
            {saving && <Spinner />}
            Lưu thay đổi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateDepartmentDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.post("/departments", { name: name.trim() });
      toast.success("Đã thêm phòng ban");
      setOpen(false);
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
          <Building2 className="h-4 w-4" />
          Thêm phòng ban
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Phòng ban mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tên phòng ban</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Phòng Kế toán" />
          </div>
          <Button className="w-full" onClick={() => void save()} disabled={!name.trim() || saving}>
            {saving && <Spinner />}
            Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
