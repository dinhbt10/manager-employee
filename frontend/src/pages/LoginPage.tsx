import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string })?.from ?? "/requests";

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch {
      setErr("Sai tài khoản hoặc mật khẩu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-teal-600/15 blur-3xl" />
      </div>
      <Card className="relative z-10 w-full max-w-md border-white/15">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <CardDescription>Hệ thống quản lý nhân viên UTC</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u">Tên đăng nhập</Label>
              <Input
                id="u"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p">Mật khẩu</Label>
              <Input
                id="p"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {err && <p className="text-sm text-red-400">{err}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Đang đăng nhập…" : "Đăng nhập"}
            </Button>
            <p className="text-center text-xs text-zinc-500">
              Demo: admin / admin123 · manager / manager123 · nhanvien / nv123456
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
