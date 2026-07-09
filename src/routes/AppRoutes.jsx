import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "../providers/AuthContext";
import { Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "../shared/components/ErrorBoundary";

const Login = lazy(() => import("../features/auth/pages/Login"));
const Register = lazy(() => import("../features/auth/pages/Register"));
const ForgotPassword = lazy(() => import("../features/auth/pages/ForgotPassword"));
const UpdatePassword = lazy(() => import("../features/auth/pages/UpdatePassword"));
const Unauthorized = lazy(() => import("../shared/components/Unauthorized"));
const NotFoundPage = lazy(() => import("../shared/components/NotFoundPage"));

const AprendizDashboard = lazy(
  () => import("../features/appointments/pages/AprendizDashboard"),
);

const ProfessionalDashboard = lazy(
  () => import("../features/appointments/pages/ProfessionalDashboard"),
);

const CoordinationDashboard = lazy(
  () => import("../features/dashboard/pages/CoordinationDashboard"),
);

const AdminDashboard = lazy(
  () => import("../features/admin/pages/AdminDashboard"),
);

function LoadingFallback() {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-spinner" />
      <p>Cargando...</p>
    </div>
  );
}

function PageWrapper({ children }) {
  return (
    <ErrorBoundary>
      <div className="route-page">{children}</div>
    </ErrorBoundary>
  );
}

export function AppRoutes() {
  const { isProfessional, isCoordination, isAdmin } = useAuth();

  const getHomeRoute = () => {
    if (isAdmin()) return "/admin";
    if (isCoordination()) return "/coordination";
    if (isProfessional()) return "/professional";
    return "/dashboard";
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
        <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
        <Route path="/update-password" element={<PageWrapper><UpdatePassword /></PageWrapper>} />
        <Route path="/unauthorized" element={<PageWrapper><Unauthorized /></PageWrapper>} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRoles="APRENDIZ">
              <PageWrapper><AprendizDashboard /></PageWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/professional"
          element={
            <ProtectedRoute requiredRoles="PROFESIONAL">
              <PageWrapper><ProfessionalDashboard /></PageWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordination"
          element={
            <ProtectedRoute requiredRoles={["COORDINACION", "SUPERADMIN"]}>
              <PageWrapper><CoordinationDashboard /></PageWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles="SUPERADMIN">
              <PageWrapper><AdminDashboard /></PageWrapper>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
        <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
      </Routes>
    </Suspense>
  );
}
