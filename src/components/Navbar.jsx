import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useEffect, useState } from "react";
import api from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { FaBell } from "react-icons/fa"; // ✅ إضافة مكتبة الأيقونات

function Navbar() {
  const navigate = useNavigate();

  /* =========================
      AUTH CONTEXT
  ========================= */
  const { user, logout, loading } = useAuth();

  /* ================================
      ⭐ منطق العداد (Unread Count)
  ================================ */
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // إذا لم يكن هناك مستخدم مسجل لا تفعل شيئاً
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        // نستخدم نفس المسار الذي عرفناه في الباك إند
        const res = await api.get("/api/notifications/unread-count");
        setUnreadCount(res.data.unreadCount);
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };

    fetchUnreadCount();
    // تحديث العداد كل دقيقة تلقائياً
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [user]);

  /* ================================
      ⭐ اسم السيستم
  ================================ */
  const [systemName, setSystemName] = useState("System");

  useEffect(() => {
    // 🔒 لا نطلب الإعدادات إلا من Admin
    if (!user || user.role !== "Admin") return;

    const loadSystemName = async () => {
      try {
        const res = await api.get("/settings");
        setSystemName(res.data.systemName || "System");
      } catch (err) {
        console.error("Failed to load system name:", err);
      }
    };

    loadSystemName();
  }, [user]);

  // أثناء التحقق من الجلسة
  if (loading) return null;

  // لا يوجد مستخدم → لا Navbar
  if (!user) return null;

  /* ================================
      🚪 Logout
  =============================== */
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="top-navbar">
      {/* التعديل في القسم الأيسر لإضافة اللوغو بشكل مرن */}
      <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img 
          src="/logo-elite.png" 
          alt="Elite Logo" 
          style={{ height: '40px', width: 'auto', flexShrink: 0 }} 
        />
        <h2 className="system-title" style={{ margin: 0 }}>{systemName}</h2>
      </div>

      <div className="nav-right">
        {/* ✅ Dashboard تظهر فقط لـ Admin و Manager */}
        {(user.role === "Admin" || user.role === "Manager") && (
          <NavLink to="/" end className="nav-link">
            Dashboard
          </NavLink>
        )}

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

        {/* ✅ أيقونة الإشعارات الجديدة */}
        <div 
          className="notification-bell-wrapper" 
          onClick={() => navigate("/notifications")} 
          style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', marginRight: '15px' }}
        >
          <FaBell size={22} color="white" />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-8px',
              backgroundColor: '#ff4d4d',
              color: 'white',
              borderRadius: '50%',
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: 'bold',
              border: '2px solid #1a1a1a'
            }}>
              {unreadCount}
            </span>
          )}
        </div>

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;