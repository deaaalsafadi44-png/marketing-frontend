import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, role }) => {
  const { user, loading, isAuthenticated } = useAuth();

  /* =========================
     WAIT FOR AUTH CHECK
  ========================= */
  if (loading) {
    return null; // أو Spinner
  }

  /* =========================
     NOT AUTHENTICATED
  ========================= */
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  /* =========================
     ROLE CHECK
  ========================= */
  const allowedRoles = Array.isArray(role)
    ? role
    : role
    ? [role]
    : [];

  if (
    allowedRoles.length > 0 &&
    (!user || !allowedRoles.includes(user.role))
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;
