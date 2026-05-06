import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { FeatureAdmin } from "@/api/types";
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
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

export function FeaturesPage() {
  const [rows, setRows] = useState<FeatureAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [qInput, setQInput] = useState("");
  const [advOpen, setAdvOpen] = useState(false);
  const [advActive, setAdvActive] = useState<"" | "active" | "inactive">("");
  const [applied, setApplied] = useState<{ q: string; active?: boolean }>({ q: "" });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    setCurrentPage(1);
  }

  function applyAdvanced() {
    setApplied({
      q: qInput.trim(),
      active: advActive === "" ? undefined : advActive === "active",
    });
    setCurrentPage(1);
  }

  // Pagination logic
  const totalItems = rows.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRows = rows.slice(startIndex, endIndex);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Chức năng (mã)"
        description="Danh mục mã chức năng dùng cho phân quyền và request — chỉ Admin. Mã không đổi sau khi tạo; có thể đổi tên hiển thị và ngưng hoạt động."
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
                {paginatedRows.map((f) => (
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
