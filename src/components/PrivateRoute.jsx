import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, role }) => {
  const rawUser = localStorage.getItem("user");
  const accessToken = localStorage.getItem("accessToken"); // 🟢 بدل refreshToken
  const refreshToken = localStorage.getItem("refreshToken");

  // لا يوجد مستخدم أو Access Token → تحويل للّوجين
  if (!rawUser || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  let user = null;
  try {
    user = JSON.parse(rawUser);
  } catch {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  if (!user || !user.role) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // -----------------------------
  // التحقق من الصلاحيات (Roles)
  // -----------------------------
  const allowedRoles = Array.isArray(role) ? role : role ? [role] : [];

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;
