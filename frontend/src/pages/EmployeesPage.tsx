import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/client";
import type { FeatureOption, User } from "@/api/types";
import { useAuth, roleLabel } from "@/auth/AuthContext";
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
import { cn } from "@/lib/utils";
import { Pencil, UserPlus } from "lucide-react";

export function EmployeesPage() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<User[]>([]);
  const [features, setFeatures] = useState<FeatureOption[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, f] = await Promise.all([api.get<User[]>("/users"), api.get<FeatureOption[]>("/features")]);
      setRows(u.data);
      setFeatures(f.data);
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
        title="Nhân viên"
        description="Admin xem toàn bộ; Quản lý xem phòng mình; Nhân viên chỉ thấy hồ sơ của mình."
        actions={isAdmin ? <CreateUserDialog features={features} onDone={load} /> : null}
      />
      <Card className="border-white/10">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-zinc-500">Đang tải…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{u.employeeCode}</TableCell>
                    <TableCell>{u.fullName}</TableCell>
                    <TableCell>{roleLabel(u.role)}</TableCell>
                    <TableCell className="text-zinc-400">{u.departmentName ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.features.length === 0 ? (
                          <Badge variant="warning">Chỉ xem</Badge>
                        ) : (
                          u.features.map((c) => (
                            <Badge key={c} variant="secondary" className="font-mono text-[10px]">
                              {c}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdmin && (
                        <EditUserDialog user={u} features={features} onDone={load} />
                      )}
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
  const [selected, setSelected] = useState<Set<string>>(() => new Set(user.features));

  useEffect(() => {
    setSelected(new Set(user.features));
  }, [user.features, user.id]);

  function toggle(code: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });
  }

  async function save() {
    await api.patch(`/users/${user.id}`, { featureCodes: [...selected] });
    setOpen(false);
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Pencil className="h-3 w-3" />
          Phân quyền
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Phân quyền — {user.fullName}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-zinc-500">Chọn nhiều chức năng (multi-select). Nhân viên không có quyền sẽ chỉ xem được dữ liệu.</p>
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-white/10 p-3">
          {features.map((f) => (
            <label key={f.code} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.has(f.code)}
                onChange={() => toggle(f.code)}
                className="rounded border-white/20"
              />
              <span>{f.name}</span>
              <span className="font-mono text-xs text-zinc-500">{f.code}</span>
            </label>
          ))}
        </div>
        <Button className="w-full" onClick={() => void save()}>
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

  function toggle(code: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });
  }

  async function save() {
    await api.post("/users", {
      fullName: fullName.trim(),
      username: username.trim(),
      password,
      role,
      departmentId: null,
      featureCodes: [...selected],
    });
    setOpen(false);
    setFullName("");
    setUsername("");
    setPassword("");
    setSelected(new Set());
    onDone();
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
                "flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white"
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
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-white/10 p-3">
              {features.map((f) => (
                <label key={f.code} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.has(f.code)}
                    onChange={() => toggle(f.code)}
                    className="rounded border-white/20"
                  />
                  <span>{f.name}</span>
                </label>
              ))}
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => void save()}
            disabled={!fullName.trim() || !username.trim() || !password}
          >
            Tạo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
