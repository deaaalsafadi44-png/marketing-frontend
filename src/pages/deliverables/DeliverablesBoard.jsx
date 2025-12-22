import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/apiClient";
import "./deliverables.css";

const DeliverablesBoard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ File modal
  const [selectedFile, setSelectedFile] = useState(null);

  // ✅ NEW: Task details modal
  const [selectedItem, setSelectedItem] = useState(null);

  // ✅ Filters state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchName, setSearchName] = useState("");

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

  // ===============================
  // APPLY FILTERS
  // ===============================
  const filteredItems = items.filter((item) => {
    const itemDate = item.createdAt ? new Date(item.createdAt) : null;

    if (fromDate && itemDate < new Date(fromDate)) return false;
    if (toDate && itemDate > new Date(toDate + "T23:59:59")) return false;

    if (
      searchName &&
      !item.submittedByName
        ?.toLowerCase()
        .includes(searchName.toLowerCase())
    )
      return false;

    return true;
  });

  return (
    <>
      <div className="deliverables-feed-page">
        <div className="deliverables-feed-header">
          <h1>Task Submissions</h1>
          <p>Live activity from your team</p>
        </div>

        {/* FILTER BAR */}
        <div className="deliverables-filters">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <input
            type="text"
            placeholder="Search by user name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </div>

        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <span>📭</span>
            <p>No submissions found</p>
          </div>
        ) : (
          <div className="deliverables-feed">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="submission-card"
                onClick={() => setSelectedItem(item)}
              >
                <div className="submission-header">
                  <div className="avatar">
                    {item.submittedByName?.charAt(0)?.toUpperCase() || "U"}
                  </div>

                  <div className="user-info">
                    <strong>{item.submittedByName || "Unknown"}</strong>
                    <span>submitted to Task #{item.taskId}</span>
                  </div>

                  <div className="date">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : "—"}
                  </div>
                </div>

                {item.notes && (
                  <div className="submission-notes">{item.notes}</div>
                )}

                <div className="submission-files">
                  {item.files && item.files.length > 0 ? (
                    item.files.map((file, i) => (
                      <button
                        key={i}
                        className="file-preview"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(file);
                        }}
                      >
                        📎 {file.originalName || "File"}
                      </button>
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

      {/* ===============================
          TASK DETAILS MODAL
      =============================== */}
      {selectedItem && (
        <div
          className="file-modal-overlay"
          onClick={() => setSelectedItem(null)}
        >
          <div className="file-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-modal"
              onClick={() => setSelectedItem(null)}
            >
              ✖
            </button>

            <h3>
              Task #{selectedItem.taskId} —{" "}
              {selectedItem.submittedByName || "Unknown"}
            </h3>

            <p style={{ fontSize: 13, color: "#6b7280" }}>
              {selectedItem.createdAt
                ? new Date(selectedItem.createdAt).toLocaleString()
                : "—"}
            </p>

            {selectedItem.notes && (
              <div className="submission-notes">
                {selectedItem.notes}
              </div>
            )}

            <div className="submission-files">
              {selectedItem.files && selectedItem.files.length > 0 ? (
                selectedItem.files.map((file, i) => (
                  <button
                    key={i}
                    className="file-preview"
                    onClick={() => setSelectedFile(file)}
                  >
                    📎 {file.originalName || "File"}
                  </button>
                ))
              ) : (
                <span className="no-files">No files attached</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===============================
          FILE PREVIEW MODAL
      =============================== */}
      {selectedFile && (
        <div
          className="file-modal-overlay"
          onClick={() => setSelectedFile(null)}
        >
          <div className="file-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-modal"
              onClick={() => setSelectedFile(null)}
            >
              ✖
            </button>

            <h3>{selectedFile.originalName || "File Preview"}</h3>

            {selectedFile.url &&
            selectedFile.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img
                src={selectedFile.url}
                alt="preview"
                className="modal-image"
              />
            ) : selectedFile.url &&
              selectedFile.url.match(/\.pdf$/i) ? (
              <iframe
                src={selectedFile.url}
                title="PDF Preview"
                className="modal-pdf"
              />
            ) : (
              <a
                href={selectedFile.url}
                target="_blank"
                rel="noreferrer"
                className="download-link"
              >
                Download file
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DeliverablesBoard;
