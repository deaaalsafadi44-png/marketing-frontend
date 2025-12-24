import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useEffect, useState } from "react";
import api from "../services/apiClient";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();

  /* =========================
      AUTH CONTEXT
  ========================= */
  const { user, logout, loading } = useAuth();

  // أثناء التحقق من الجلسة
  if (loading) return null;

  // لا يوجد مستخدم → لا Navbar
  if (!user) return null;

  /* ================================
      ⭐ اسم السيستم
  ================================ */
  const [systemName, setSystemName] = useState("System");

  useEffect(() => {
    // 🔒 لا نطلب الإعدادات إلا من Admin
    if (user.role !== "Admin") return;

    const loadSystemName = async () => {
      try {
        const res = await api.get("/settings");
        setSystemName(res.data.systemName || "System");
      } catch (err) {
        console.error("Failed to load system name:", err);
      }
    };

    loadSystemName();
  }, [user.role]);

  /* ================================
      🚪 Logout
  ================================ */
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="top-navbar">
      <div className="nav-left">
        <h2 className="system-title">{systemName}</h2>
      </div>

      <div className="nav-right">
        <NavLink to="/" end className="nav-link">
          Dashboard
        </NavLink>

        <NavLink to="/tasks" className="nav-link">
          Tasks
        </NavLink>

        {/* ⭐ Submissions / Deliverables - تظهر الآن للجميع */}
        <NavLink to="/submissions" className="nav-link">
          Submissions
        </NavLink>

        {/* ✅ Admin + Manager فقط للـ Reports */}
        {(user.role === "Admin" || user.role === "Manager") && (
          <>
            <NavLink to="/reports" className="nav-link">
              Reports
            </NavLink>
          </>
        )}

        {/* ✅ Admin فقط */}
        {user.role === "Admin" && (
          <>
            <NavLink to="/users" className="nav-link">
              Users
            </NavLink>
            <NavLink to="/settings" className="nav-link">
              Settings
            </NavLink>
          </>
        )}

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;