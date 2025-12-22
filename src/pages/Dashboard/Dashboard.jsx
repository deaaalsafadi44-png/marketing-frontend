import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/apiClient";
import "./deliverables.css";

const formatDuration = (minutes) => {
  if (!minutes || isNaN(minutes)) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

const safeDate = (value) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
};

const DeliverablesBoard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [taskDetails, setTaskDetails] = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliverables();
  }, [location.pathname]);

  useEffect(() => {
    if (!selectedItem?.taskId) return;

    const loadTask = async () => {
      try {
        setTaskLoading(true);
        const res = await api.get(`/tasks/${selectedItem.taskId}`);
        setTaskDetails(res.data);
      } catch {
        setTaskDetails(null);
      } finally {
        setTaskLoading(false);
      }
    };

    loadTask();
  }, [selectedItem]);

  if (loading) {
    return <div className="deliverables-loading">Loading submissions...</div>;
  }

  const filteredItems = items.filter((item) => {
    const d = new Date(item.createdAt);
    if (fromDate && d < new Date(fromDate)) return false;
    if (toDate && d > new Date(toDate + "T23:59:59")) return false;
    if (
      searchName &&
      !item.submittedByName?.toLowerCase().includes(searchName.toLowerCase())
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

        <div className="deliverables-filters">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <input
            type="text"
            placeholder="Search by user name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </div>

        <div className="deliverables-feed">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="submission-card"
              onClick={() => {
                setSelectedItem(item);
                setTaskDetails(null);
              }}
            >
              {/* ✅ TITLE */}
              <h4 style={{ marginBottom: 6 }}>
                {taskDetails?.id === item.taskId
                  ? taskDetails.title
                  : `Task #${item.taskId}`}
              </h4>

              <div className="submission-header">
                <div className="avatar">
                  {item.submittedByName?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="user-info">
                  <strong>{item.submittedByName}</strong>
                  <span>submitted this task</span>
                </div>

                <div className="date">{safeDate(item.createdAt)}</div>
              </div>

              {item.notes && (
                <div className="submission-notes">{item.notes}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ===============================
          TASK DETAILS MODAL
      =============================== */}
      {selectedItem && (
        <div className="file-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="task-details-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedItem(null)}>
              ✖
            </button>

            <h2>{taskDetails?.title || `Task #${selectedItem.taskId}`}</h2>
            <p>
              Submitted by <strong>{selectedItem.submittedByName}</strong> •{" "}
              {safeDate(selectedItem.createdAt)}
            </p>

            {taskLoading ? (
              <p>Loading details...</p>
            ) : taskDetails && (
              <>
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <span className="file-preview">🏢 {taskDetails.company || "—"}</span>
                  <span className="file-preview">🏷 {taskDetails.type || "—"}</span>
                  <span className="file-preview">
                    ⏱ {formatDuration(taskDetails.timeSpent)}
                  </span>
                </div>

                <div className="task-description-box">
                  <h4>Description</h4>
                  <div className="task-description-scroll">
                    {taskDetails.description || "No description"}
                  </div>
                </div>
              </>
            )}

            <div className="task-files-section">
              <h4>Attachments</h4>

              {selectedItem.files?.length ? (
                <div className="task-files-grid">
                  {selectedItem.files.map((file, i) => (
                    <div
                      key={i}
                      className="task-file-card"
                      onClick={() => setSelectedFile(file)}
                    >
                      {file.url?.match(/\.(jpg|jpeg|png|gif)$/i) && (
                        <img src={file.url} alt="" />
                      )}
                      {file.url?.match(/\.(mp4|webm)$/i) && (
                        <video src={file.url} muted />
                      )}
                      {!file.url?.match(/\.(jpg|jpeg|png|gif|mp4|webm)$/i) && (
                        <div className="file-generic">
                          📎 {file.originalName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="no-files">No files attached</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FILE PREVIEW */}
      {selectedFile && (
        <div className="file-modal-overlay" onClick={() => setSelectedFile(null)}>
          <div className="file-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedFile(null)}>
              ✖
            </button>

            <h3>{selectedFile.originalName}</h3>

            {selectedFile.url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img src={selectedFile.url} className="modal-image" alt="" />
            ) : selectedFile.url?.match(/\.pdf$/i) ? (
              <iframe src={selectedFile.url} className="modal-pdf" title="pdf" />
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
