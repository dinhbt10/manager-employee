import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Department } from "@/api/types";
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
import { Building2 } from "lucide-react";

export function DepartmentsPage() {
  const [rows, setRows] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<Department[]>("/departments");
      setRows(r.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Phòng ban"
        description="Chỉ Admin quản lý danh mục phòng ban."
        actions={
          <CreateDepartmentDialog onDone={load} />
        }
      />
      <Card className="border-white/10">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-zinc-500">Đang tải…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên phòng ban</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs text-brand-300">{d.code}</TableCell>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>
                      <Badge variant={d.active ? "success" : "destructive"}>
                        {d.active ? "Hoạt động" : "Ngưng"}
                      </Badge>
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

function CreateDepartmentDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  async function save() {
    if (!name.trim()) return;
    await api.post("/departments", { name: name.trim() });
    setOpen(false);
    setName("");
    onDone();
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
          <Button className="w-full" onClick={() => void save()} disabled={!name.trim()}>
            Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
