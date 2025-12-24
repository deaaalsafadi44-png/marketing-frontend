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

  // استخراج الدور بجميع الحالات
  let userRole = null;

  if (typeof user.role === "string") {
    userRole = user.role;
  } else if (typeof user.role === "object" && user.role !== null) {
    userRole = user.role.name || user.role.role;
  }

  const normalizedUserRole = userRole?.toLowerCase().trim();
  
  // تحويل الأدوار المسموحة إلى مصفوفة أحرف صغيرة (إذا وُجدت)
  const allowedRoles = Array.isArray(roles) ? roles.map(r => r.toLowerCase().trim()) : null;

  console.log("PRIVATE ROUTE CHECK 👉", {
    normalizedUserRole,
    allowedRoles,
    originalRole: user.role,
  });

  // ✅ إذا تم تحديد أدوار معينة (roles) ولم يكن دور المستخدم منها -> يمنع الدخول
  if (allowedRoles && !allowedRoles.includes(normalizedUserRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ في حال لم تُحدد roles أو كان الدور موجوداً -> يسمح بالدخول
  return children;
};

export default PrivateRoute;