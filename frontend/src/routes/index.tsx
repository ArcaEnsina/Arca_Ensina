import { createBrowserRouter } from "react-router";
import {
  RedirectIfAuthenticated,
  CatchAll,
  ShellLayout,
} from "./guards";

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
        path: "/patients/:id/history",
        lazy: () =>
          import("@/features/patient/pages/PatientHistoryPage").then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: "/protocols/manual",
        lazy: () =>
          import("@/features/protocol/pages/ManualProtocolSelectPage").then((m) => ({
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
        path: "/sedation",
        lazy: () =>
          import("@/features/sedacao/pages/SedationPanelPage").then((m) => ({
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
        path: "/guided-protocol/:protocolId/step/:stepNumber",
        lazy: () =>
          import("@/features/guidedProtocol/pages/GuidedProtocolStepRouter").then((m) => ({
            Component: m.default,
          })),
      },
    ],
  },
  {
    path: "/login",
    lazy: () =>
      import("@/features/auth/pages/LoginPage").then((m) => ({
        Component: () => (
          <RedirectIfAuthenticated>
            <m.default />
          </RedirectIfAuthenticated>
        ),
      })),
  },
  {
    path: "/invite/:token",
    lazy: () =>
      import("@/features/auth/pages/InvitePage").then((m) => ({
        Component: () => (
          <RedirectIfAuthenticated>
            <m.default />
          </RedirectIfAuthenticated>
        ),
      })),
  },
  {
    path: "*",
    Component: CatchAll,
  },
]);

export default router;