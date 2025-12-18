import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/apiClient";
import "./deliverables.css";

const DeliverablesBoard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const loadDeliverables = async () => {
    try {
      setLoading(true);
      const res = await api.get("/deliverables");

      // 🔍 للتأكد أثناء التطوير
      console.log("DELIVERABLES RESPONSE:", res.data);

      // ✅ التصحيح المهم
    setItems(Array.isArray(res.data) ? res.data : res.data?.data || []);

    } catch (err) {
      console.error("Failed to load deliverables:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 يعاد التحميل كل مرة تدخل صفحة Submissions
  useEffect(() => {
    loadDeliverables();
  }, [location.pathname]);

  if (loading) {
    return <div className="loading">Loading submissions...</div>;
  }

  return (
    <div className="deliverables-wrapper">
      <h1 className="deliverables-title">📦 Task Submissions</h1>

      {items.length === 0 ? (
        <p style={{ textAlign: "center" }}>No submissions yet.</p>
      ) : (
        <div className="deliverables-list">
          {items.map((item) => (
            <div key={item._id} className="deliverable-card">
              <h3>Task #{item.taskId}</h3>

              <p>
                <strong>Submitted By:</strong> {item.submittedByName}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleString()
                  : "—"}
              </p>

              {item.notes && item.notes.trim() !== "" && (
                <p>
                  <strong>Notes:</strong> {item.notes}
                </p>
              )}

              <div className="files-section">
                {item.files && item.files.length > 0 ? (
                  item.files.map((file, i) => (
                    <div key={i} className="file-item">
                      <a href={file.url} target="_blank" rel="noreferrer">
                        {file.originalName || "File"}
                      </a>
                    </div>
                  ))
                ) : (
                  <p>No files</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliverablesBoard;
