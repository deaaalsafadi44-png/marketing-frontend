import "./settings.css";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";

const Settings = () => {
  const { user, loading } = useAuth();

  const [systemName, setSystemName] = useState("");
  const [saving, setSaving] = useState(false);

  /* =========================
     LOAD SETTINGS
  ========================= */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get("/settings");
        setSystemName(res.data.systemName || "");
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };

    if (user) {
      loadSettings();
    }
  }, [user]);

  /* =========================
     LOADING STATE
  ========================= */
  if (loading || !user) {
    return <div className="loading">Loading...</div>;
  }

  /* =========================
     SAVE
  ========================= */
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/settings", { systemName });
      alert("Settings saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-wrapper">
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

          <button
            className="save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
