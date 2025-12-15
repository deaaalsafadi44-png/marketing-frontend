import React, { useEffect, useState } from "react";
import api from "../../services/apiClient";
import "./manageOptions.css";

const ManageOptions = () => {
  const [options, setOptions] = useState({ priority: [], status: [], companies: [] });
  const [newPriority, setNewPriority] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOptions = async () => {
    try {
      const res = await api.get("/options");

      const data = res.data || {};

      // نضمن دائماً وجود المصفوفات حتى لو الملف قديم
      setOptions({
        priority: data.priority || [],
        status: data.status || [],
        companies: data.companies || [],
      });
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
      // نحافظ دائماً على المفاتيح الثلاثة
      const payload = {
        priority: updated.priority || [],
        status: updated.status || [],
        companies: updated.companies || [],
      };

      await api.put("/options", payload);
      setOptions(payload);
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

  const addCompany = () => {
    if (!newCompany.trim()) return;
    saveOptions({
      ...options,
      companies: [...(options.companies || []), newCompany.trim()],
    });
    setNewCompany("");
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

  const deleteCompany = (item) => {
    saveOptions({
      ...options,
      companies: (options.companies || []).filter((c) => c !== item),
    });
  };

  if (loading) return <div className="opt-loading">Loading options...</div>;

  return (
    <div className="opt-container">
      <h1 className="opt-title">Manage Options</h1>

      {error && <p className="opt-error">{error}</p>}

      {/* Priority Options */}
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

      {/* Status Options */}
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

      {/* Companies Options */}
      <div className="opt-box">
        <h2>Companies</h2>

        <div className="opt-form">
          <input
            type="text"
            placeholder="Add new company..."
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
          />
          <button onClick={addCompany}>Add</button>
        </div>

        <ul className="opt-list">
          {(options.companies || []).map((c, i) => (
            <li key={i}>
              {c}
              <button className="del-btn" onClick={() => deleteCompany(c)}>
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
