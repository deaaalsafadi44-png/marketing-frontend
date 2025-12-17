import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // انتظر تحميل حالة التوثيق
  if (loading) {
    return null; // أو Spinner
  }

  // غير مسجّل
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // توحيد role
  const userRole =
    typeof user.role === "string"
      ? user.role.toLowerCase().trim()
      : user.role?.name?.toLowerCase().trim();

  // التحقق من الصلاحيات
  if (roles && !roles.map(r => r.toLowerCase()).includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;
