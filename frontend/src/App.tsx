import { type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DesignSystem from "./pages/DesignSystem";
import Patients from "./pages/Patients";
import MedicationsList from "./components/Medications/MedicationsList"; //for now (fazer a pagina ainda)
import Calculator from "./pages/Calculator";
import { Toaster } from "@/components/ui/sonner";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <p className="text-center mt-20">Carregando...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <p className="text-center mt-20">Carregando...</p>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/_/design-system"
          element={
            <ProtectedRoute>
              <DesignSystem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <Patients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calculator/calculate/:medicationId"
          element={
            <ProtectedRoute>
              <Calculator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medications"
          element={
            <ProtectedRoute>
              <MedicationsList />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
