import { NavLink, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/usersService";
import "./Navbar.css";
import { useEffect, useState } from "react";
import api from "../services/apiClient";

function Navbar() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const accessToken = localStorage.getItem("accessToken");

  if (!user || !accessToken) return null;

  // ================================
  // ⭐ تحميل اسم السيستم بشكل ديناميكي
  // ================================
  const [systemName, setSystemName] = useState("System");

  useEffect(() => {
    const loadSystemName = async () => {
      try {
        const res = await api.get("/settings");
        setSystemName(res.data.systemName || "System");
      } catch (err) {
        console.error("Failed to load system name:", err);
      }
    };

    loadSystemName();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {}

    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="top-navbar">
      <div className="nav-left">
        {/* ⭐ هنا الاسم الديناميكي */}
        <h2 className="system-title">{systemName}</h2>
      </div>

      <div className="nav-right">

        <NavLink to="/" end className="nav-link">Dashboard</NavLink>
        <NavLink to="/tasks" className="nav-link">Tasks</NavLink>

        {(user.role === "Admin" || user.role === "Manager") && (
          <NavLink to="/reports" className="nav-link">Reports</NavLink>
        )}

        {user.role === "Admin" && (
          <>
            <NavLink to="/users" className="nav-link">Users</NavLink>
            <NavLink to="/settings" className="nav-link">Settings</NavLink>
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
