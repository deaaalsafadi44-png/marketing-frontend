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
      setItems(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error("Failed to load deliverables:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliverables();
  }, [location.pathname]);

  if (loading) {
    return <div className="deliverables-loading">Loading submissions...</div>;
  }

  return (
    <div className="deliverables-page">
      <div className="deliverables-card">
        {/* HEADER */}
        <div className="deliverables-header">
          <div>
            <h1>Task Submissions</h1>
            <p>All submitted work from team members</p>
          </div>
          <span className="submissions-count">
            {items.length} Submissions
          </span>
        </div>

        {/* EMPTY */}
        {items.length === 0 ? (
          <div className="empty-state">
            <span>📭</span>
            <p>No submissions yet</p>
          </div>
        ) : (
          <div className="deliverables-grid">
            {items.map((item) => (
              <div key={item._id} className="deliverable-item">
                {/* TOP */}
                <div className="deliverable-top">
                  <span className="task-badge">
                    Task #{item.taskId}
                  </span>
                  <span className="date">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>

                {/* USER */}
                <div className="deliverable-user">
                  👤 {item.submittedByName || "Unknown User"}
                </div>

                {/* NOTES */}
                {item.notes && (
                  <p className="notes">
                    {item.notes}
                  </p>
                )}

                {/* FILES */}
                <div className="files">
                  {item.files && item.files.length > 0 ? (
                    item.files.map((file, i) => (
                      <a
                        key={i}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="file-chip"
                      >
                        📎 {file.originalName || "File"}
                      </a>
                    ))
                  ) : (
                    <span className="no-files">No files attached</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliverablesBoard;
