import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useEffect, useState } from "react";
import api from "../services/apiClient";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  if (loading || !user) return null;

  const [systemName, setSystemName] = useState("System");

  useEffect(() => {
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="top-navbar">
      <div className="nav-left">
        <span className="system-title">{systemName}</span>
      </div>

      <div className="nav-center">
        <NavLink to="/" end className="nav-link">
          Dashboard
        </NavLink>

        <NavLink to="/deliverables" className="nav-link">
          Submissions
        </NavLink>

        <NavLink to="/tasks" className="nav-link">
          Tasks
        </NavLink>

        {(user.role === "Admin" || user.role === "Manager") && (
          <NavLink to="/reports" className="nav-link">
            Reports
          </NavLink>
        )}

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
      </div>

      <div className="nav-right">
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
