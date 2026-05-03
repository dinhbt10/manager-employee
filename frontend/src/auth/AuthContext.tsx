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
import type { LoginResponse, Role, FeatureCode } from "@/api/types";

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
  hasFeature: (code: FeatureCode) => boolean;
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
  const [user, setUser] = useState<LoginResponse | null>(() =>
    loadStoredUser(),
  );

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    // Clear all localStorage
    localStorage.clear();
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    setTok(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const onLogout = () => logout();
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [logout]);

  // Fetch fresh user data on mount if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const { data } = await api.get<LoginResponse>("/auth/me");
        setUser(data);
        localStorage.setItem(USER_KEY, JSON.stringify(data));
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        // If 401, logout
        if ((error as any).response?.status === 401) {
          logout();
        }
      }
    };

    fetchUser();
  }, [token, logout]);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post<LoginResponse>("/auth/login", {
      username,
      password,
    });
    setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setTok(data.token);
    setUser(data);
  }, []);

  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "MANAGER";
  const canSeeDepartments = isAdmin || isManager; // Manager cũng thấy menu Phòng ban

  const hasFeature = useCallback(
    (code: FeatureCode): boolean => {
      if (user?.role === "ADMIN") return true;
      
      // Manager tự động có quyền trong phòng ban của mình
      if (user?.role === "MANAGER" && user?.departmentId) {
        // Quyền xem nhân viên trong phòng
        if (code === "EMP_VIEW_DEPT" || code === "EMP_VIEW_ALL") return true;
        // Quyền sửa nhân viên trong phòng
        if (code === "EMP_EDIT_DEPT") return true;
        // Quyền phê duyệt request trong phòng
        if (code === "REQ_APPROVE_DEPT") return true;
        // Quyền xem phòng ban (chỉ xem, không tạo/sửa)
        if (code === "DEPT_VIEW") return true;
        // KHÔNG tự động có DEPT_CREATE và DEPT_EDIT
      }
      
      return user?.features.includes(code) ?? false;
    },
    [user?.features, user?.role, user?.departmentId],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      login,
      logout,
      isAdmin,
      isManager,
      canSeeDepartments,
      hasFeature,
    }),
    [
      token,
      user,
      login,
      logout,
      isAdmin,
      isManager,
      canSeeDepartments,
      hasFeature,
    ],
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
