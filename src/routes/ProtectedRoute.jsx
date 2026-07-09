import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";

export function ProtectedRoute({
  children,
  requiredRoles = null,
  fallback = "/login",
}) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen" role="status" aria-live="polite">
        <div className="loading-spinner" />
        <p>Cargando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallback} state={{ from: location }} replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
