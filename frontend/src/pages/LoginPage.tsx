import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/apiError";
import { Sparkles } from "lucide-react";

export function LoginPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string })?.from ?? "/requests";

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success("Đăng nhập thành công");
      navigate(from, { replace: true });
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Sai tài khoản hoặc mật khẩu"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-80 w-80 animate-pulse rounded-full bg-gradient-to-br from-brand-500/30 to-teal-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tl from-violet-600/20 to-fuchsia-500/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/10 blur-3xl" />
      </div>

      <Card className="animate-fade-in-up relative z-10 w-full max-w-md overflow-hidden border-zinc-200/90 shadow-xl shadow-zinc-300/50">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-teal-400 to-violet-500" />
        <CardHeader className="space-y-3 pb-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-600 shadow-lg ring-2 ring-white/10">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Đăng nhập</CardTitle>
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
                className="h-11"
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
                className="h-11"
              />
            </div>
            <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
              {loading ? (
                <>
                  <Spinner />
                  Đang đăng nhập…
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
            <p className="text-center text-xs leading-relaxed text-zinc-600">
              Demo: <span className="font-medium text-zinc-800">admin</span> / admin123 ·{" "}
              <span className="font-medium text-zinc-800">manager</span> / manager123 ·{" "}
              <span className="font-medium text-zinc-800">nhanvien</span> / nv123456
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
