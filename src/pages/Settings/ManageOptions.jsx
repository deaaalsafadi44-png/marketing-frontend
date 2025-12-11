import React, { useEffect, useState } from "react";
import api from "../../services/apiClient";
import "./manageOptions.css";

const ManageOptions = () => {
  const [options, setOptions] = useState({ priority: [], status: [] });
  const [newPriority, setNewPriority] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOptions = async () => {
    try {
      const res = await api.get("/options");
      setOptions(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Session expired. Please refresh page.");
      } else if (err.response?.status === 403) {
        setError("You do not have permission to manage options.");
      } else {
        setError("Failed to load options.");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const saveOptions = async (updated) => {
    try {
      await api.put("/options", updated);
      setOptions(updated);
    } catch (err) {
      setError("Failed to save options.");
    }
  };

  const addPriority = () => {
    if (!newPriority.trim()) return;
    saveOptions({
      ...options,
      priority: [...options.priority, newPriority.trim()],
    });
    setNewPriority("");
  };

  const addStatus = () => {
    if (!newStatus.trim()) return;
    saveOptions({
      ...options,
      status: [...options.status, newStatus.trim()],
    });
    setNewStatus("");
  };

  const deletePriority = (item) => {
    saveOptions({
      ...options,
      priority: options.priority.filter((p) => p !== item),
    });
  };

  const deleteStatus = (item) => {
    saveOptions({
      ...options,
      status: options.status.filter((s) => s !== item),
    });
  };

  if (loading) return <div className="opt-loading">Loading options...</div>;

  return (
    <div className="opt-container">
      <h1 className="opt-title">Manage Options</h1>

      {error && <p className="opt-error">{error}</p>}

      <div className="opt-box">
        <h2>Priority Options</h2>

        <div className="opt-form">
          <input
            type="text"
            placeholder="Add new priority..."
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
          />
          <button onClick={addPriority}>Add</button>
        </div>

        <ul className="opt-list">
          {options.priority.map((p, i) => (
            <li key={i}>
              {p}
              <button className="del-btn" onClick={() => deletePriority(p)}>
                ✖
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="opt-box">
        <h2>Status Options</h2>

        <div className="opt-form">
          <input
            type="text"
            placeholder="Add new status..."
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          />
          <button onClick={addStatus}>Add</button>
        </div>

        <ul className="opt-list">
          {options.status.map((s, i) => (
            <li key={i}>
              {s}
              <button className="del-btn" onClick={() => deleteStatus(s)}>
                ✖
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ManageOptions;
