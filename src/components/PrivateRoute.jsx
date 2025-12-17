import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ FIX: استخراج role بجميع الحالات
  let userRole = null;

  if (typeof user.role === "string") {
    userRole = user.role;
  } else if (typeof user.role === "object" && user.role !== null) {
    userRole = user.role.name || user.role.role;
  }

  const normalizedUserRole = userRole?.toLowerCase().trim();
  const allowedRoles = roles?.map(r => r.toLowerCase().trim());

  // 🔍 DEBUG (اختياري)
  console.log("PRIVATE ROUTE CHECK 👉", {
    normalizedUserRole,
    allowedRoles,
    originalRole: user.role,
  });

  if (roles && !allowedRoles.includes(normalizedUserRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;
