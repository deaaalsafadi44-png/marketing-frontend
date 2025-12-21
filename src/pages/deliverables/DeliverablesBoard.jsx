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
        <div className="deliverables-header">
          <h1>📦 Task Submissions</h1>
          <p>All submitted work from team members</p>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <span>📭</span>
            <p>No submissions yet</p>
          </div>
        ) : (
          <div className="deliverables-grid">
            {items.map((item) => (
              <div key={item._id} className="deliverable-item">
                <div className="deliverable-top">
                  <span className="task-badge">Task #{item.taskId}</span>
                  <span className="date">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>

                <h3>{item.submittedByName}</h3>

                {item.notes && (
                  <p className="notes">{item.notes}</p>
                )}

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
                    <span className="no-files">No files</span>
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
