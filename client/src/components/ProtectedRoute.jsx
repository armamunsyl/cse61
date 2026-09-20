import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <div className="mx-auto max-w-7xl px-4 py-10">Loading admin session...</div>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
}
