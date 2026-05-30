import { type ReactNode } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/features/auth";
import { AppShell } from "@/components/shell/AppShell";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <p className="text-center mt-20">Carregando...</p>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/** Redireciona para o dashboard se o usuário já estiver autenticado. */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <p className="text-center mt-20">Carregando...</p>;
  }
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

/** Catch-all: redireciona para dashboard se logado, login se não. */
export function CatchAll() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <p className="text-center mt-20">Carregando...</p>;
  }
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

/** Layout das rotas autenticadas: exige sessão e envolve tudo no AppShell. */
export function ShellLayout() {
  return (
    <RequireAuth>
      <AppShell>
        <Outlet />
      </AppShell>
    </RequireAuth>
  );
}
