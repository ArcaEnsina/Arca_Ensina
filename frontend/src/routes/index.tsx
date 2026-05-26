import { type ReactNode } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { useAuth } from "@/features/auth";
import { AppShell } from "@/components/shell/AppShell";

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <p className="text-center mt-20">Carregando...</p>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function ShellLayout() {
  return (
    <RequireAuth>
      <AppShell>
        <Outlet />
      </AppShell>
    </RequireAuth>
  );
}

const router = createBrowserRouter([
  {
    element: <ShellLayout />,
    children: [
      {
        path: "/dashboard",
        lazy: () =>
          import("@/pages/Dashboard").then((m) => ({ Component: m.default })),
      },
      {
        path: "/_/design-system",
        lazy: () =>
          import("@/pages/DesignSystem").then((m) => ({ Component: m.default })),
      },
      {
        path: "/patients",
        lazy: () =>
          import("@/features/patient/pages/PatientCreatePage").then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: "/patients/list",
        lazy: () =>
          import("@/pages/PatientListPage").then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: "/medications",
        lazy: () =>
          import("@/features/calculator/pages/MedicationSelectPage").then(
            (m) => ({ Component: m.default }),
          ),
      },
      {
        path: "/repositorio",
        lazy: () =>
          import("@/pages/Repositorio").then((m) => ({ Component: m.default })),
      },
      {
        path: "/calculator/calculate/:medicationId",
        lazy: () =>
          import("@/features/calculator/pages/CalculatorPage").then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: "/guided-protocol",
        lazy: () =>
          import("@/features/guidedProtocol/pages/GuidedProtocolPage").then((m) => ({
            Component: m.default,
        })),
      },
      {
        path: "/guided-protocol/step/2",
        lazy: () =>
          import("@/features/guidedProtocol/pages/GuidedProtocolStep2Page").then((m) => ({
            Component: m.default,
        })),
      },
      {
        path: "/guided-protocol/step/3",
        lazy: () =>
          import("@/features/guidedProtocol/pages/GuidedProtocolStep3Page").then((m) => ({
            Component: m.default,
        })),
      },
      {
        path: "/guided-protocol/step/4",
        lazy: () =>
          import("@/features/guidedProtocol/pages/GuidedProtocolStep4Page").then((m) => ({
            Component: m.default,
        })),
      },
      {
        path: "/guided-protocol/step/5",
        lazy: () =>
          import("@/features/guidedProtocol/pages/GuidedProtocolStep5Page").then((m) => ({
            Component: m.default,
        })),
      },
      {
        path: "/guided-protocol/step/6",
        lazy: () =>
          import("@/features/guidedProtocol/pages/GuidedProtocolStep6Page").then((m) => ({
            Component: m.default,
        })),
      },
      ],
  },
  {
    path: "/login",
    lazy: () =>
      import("@/features/auth/pages/LoginPage").then((m) => ({
        Component: m.default,
      })),
  },
  {
    path: "/invite/:token",
    lazy: () =>
      import("@/features/auth/pages/InvitePage").then((m) => ({
        Component: m.default,
      })),
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

export default router;
