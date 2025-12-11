import "./settings.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../services/apiClient";

const Settings = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [systemName, setSystemName] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);

    if (storedUser && storedUser.role !== "Admin") {
      alert("❌ Only Admin can access System Settings");
      navigate("/");
      return;
    }

    const loadSettings = async () => {
      try {
        const res = await api.get("/settings");
        setSystemName(res.data.systemName || "");
      } catch (err) {
        console.error("Failed to load settings:", err);
      }

      setLoading(false);
    };

    loadSettings();
  }, [navigate]);

  if (!user || loading) return <div className="loading">Loading...</div>;

  const handleSave = async () => {
    try {
      await api.put("/settings", { systemName });
      alert("Settings saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save.");
    }
  };

  return (
    <div className="settings-wrapper">

      {/* 🟦 كل شيء داخل بوكس واحد */}
      <div className="settings-big-card">

        <div className="settings-top-row">
          <h1 className="settings-title">System Settings</h1>

          <Link to="/settings/options">
            <button className="manage-options-btn">
              ⚙ Manage Priority & Status Options
            </button>
          </Link>
        </div>

        <div className="settings-user-box">
          Logged in as: <strong>{user.name}</strong> ({user.role})
        </div>

        <div className="compact-card">
          <h2 className="section-title">General Information</h2>

          <div className="settings-field">
            <label>System Name</label>
            <input
              type="text"
              className="input-field"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
            />
          </div>

          <button className="save-btn" onClick={handleSave}>
            Save Settings
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
