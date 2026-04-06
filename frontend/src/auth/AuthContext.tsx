import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken } from "@/api/client";
import type { LoginResponse, Role } from "@/api/types";

const USER_KEY = "emp_user";

type AuthState = {
  token: string | null;
  user: LoginResponse | null;
};

type AuthContextValue = AuthState & {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  canSeeDepartments: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): LoginResponse | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LoginResponse;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTok] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<LoginResponse | null>(() => loadStoredUser());

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setTok(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const onLogout = () => logout();
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [logout]);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post<LoginResponse>("/auth/login", { username, password });
    setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setTok(data.token);
    setUser(data);
  }, []);

  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "MANAGER";
  const canSeeDepartments = isAdmin;

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      login,
      logout,
      isAdmin,
      isManager,
      canSeeDepartments,
    }),
    [token, user, login, logout, isAdmin, isManager, canSeeDepartments]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth trong AuthProvider");
  return ctx;
}

export function roleLabel(r: Role): string {
  switch (r) {
    case "ADMIN":
      return "Quản trị viên";
    case "MANAGER":
      return "Quản lý";
    default:
      return "Nhân viên";
  }
}
