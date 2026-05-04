import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function ProtectedRoute({
  children,
  requireSystemMonitorAccess = false,
}) {
  const { isAuthenticated, loading, canAccessSystemMonitor } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="auth-screen">Verificando sua sessão...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireSystemMonitorAccess && !canAccessSystemMonitor) {
    return <Navigate to="/admin/links" replace />;
  }

  return children;
}
