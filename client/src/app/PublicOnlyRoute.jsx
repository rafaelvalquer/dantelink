import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="auth-screen">Carregando...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/links" replace />;
  }

  return children;
}
