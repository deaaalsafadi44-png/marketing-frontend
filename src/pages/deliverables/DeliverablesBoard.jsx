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
    <div className="deliverables-feed-page">
      <div className="deliverables-feed-header">
        <h1>Task Submissions</h1>
        <p>Live activity from your team</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <span>📭</span>
          <p>No submissions yet</p>
        </div>
      ) : (
        <div className="deliverables-feed">
          {items.map((item) => (
            <div key={item._id} className="submission-card">
              {/* Header */}
              <div className="submission-header">
                <div className="avatar">
                  {item.submittedByName?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="user-info">
                  <strong>{item.submittedByName || "Unknown"}</strong>
                  <span>
                    submitted to Task #{item.taskId}
                  </span>
                </div>

                <div className="date">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : "—"}
                </div>
              </div>

              {/* Notes */}
              {item.notes && (
                <div className="submission-notes">
                  {item.notes}
                </div>
              )}

              {/* Files */}
              <div className="submission-files">
                {item.files && item.files.length > 0 ? (
                  item.files.map((file, i) => (
                    <a
                      key={i}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="file-preview"
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
  );
};

export default DeliverablesBoard;
