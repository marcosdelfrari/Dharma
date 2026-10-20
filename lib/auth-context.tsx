"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  api,
  ApiError,
  displayName,
  parsePermissions,
  type OperatorUser,
} from "@/lib/api";
import { PATHS, STAFF_ROLES } from "@/lib/menu";
import type { RolePagesMap } from "@/lib/role-pages";
import { isProfessionalOnly, roleHomePath } from "@/lib/role-redirect";

type AuthState = {
  user: OperatorUser | null;
  loading: boolean;
  error: string | null;
  permissions: string[];
  rolePages: RolePagesMap | null;
  isStaff: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const PUBLIC_PATHS = new Set([
  "/login",
  "/cadastro",
  "/contato",
  "/nova-senha",
  "/unauthorized",
  "/not-connected",
]);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<OperatorUser | null>(null);
  const [rolePages, setRolePages] = useState<RolePagesMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const booted = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  const permissions = useMemo(() => parsePermissions(user), [user]);
  const isStaff = permissions.some((role) => STAFF_ROLES.includes(role));

  const applySession = useCallback(
    (payload: { user: OperatorUser; role_pages?: RolePagesMap | null }) => {
      setUser(payload.user);
      setRolePages(payload.role_pages ?? null);
      setError(null);
    },
    [],
  );

  const refresh = useCallback(async () => {
    try {
      const res = await api.me();
      applySession({
        user: res.data.user,
        role_pages: (res.data.role_pages as RolePagesMap | null) ?? null,
      });
    } catch (err) {
      setUser(null);
      setRolePages(null);
      if (err instanceof ApiError && err.status !== 401) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.has(pathname) || pathname.startsWith("/cadastro");
    if (!user && pathname.startsWith("/app")) {
      router.replace("/login");
      return;
    }
    if (!user && pathname.startsWith("/relatorio")) {
      router.replace("/login");
      return;
    }
    if (user && pathname === "/login") {
      router.replace(roleHomePath(parsePermissions(user)));
      return;
    }
    if (user && isProfessionalOnly(parsePermissions(user)) && pathname.startsWith("/app")) {
      router.replace(PATHS.professionalServicesReport);
      return;
    }
    if (user && !isPublic && pathname === "/") {
      router.replace(roleHomePath(parsePermissions(user)));
    }
  }, [loading, user, pathname, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      await api.login(email, password);
      const me = await api.me();
      applySession({
        user: me.data.user,
        role_pages: (me.data.role_pages as RolePagesMap | null) ?? null,
      });
      router.replace(roleHomePath(parsePermissions(me.data.user)));
    },
    [applySession, router],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setRolePages(null);
      router.replace("/login");
    }
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      permissions,
      rolePages,
      isStaff,
      login,
      logout,
      refresh,
    }),
    [user, loading, error, permissions, rolePages, isStaff, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}

export function useAuthLabel() {
  const { user, permissions } = useAuth();
  return {
    name: displayName(user),
    role: permissions[0] || "—",
    initial: (displayName(user).charAt(0) || "D").toUpperCase(),
  };
}
