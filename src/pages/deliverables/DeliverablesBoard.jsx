import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/apiClient";
import "./deliverables.css";

const DeliverablesBoard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [taskDetails, setTaskDetails] = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);

  const [taskTitles, setTaskTitles] = useState({});

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

  // Load task titles
  useEffect(() => {
    const loadTitles = async () => {
      const missingIds = items
        .map((i) => i.taskId)
        .filter((id) => id && !taskTitles[id]);

      if (!missingIds.length) return;

      const newTitles = {};

      for (const id of missingIds) {
        try {
          const res = await api.get(`/tasks/${id}`);
          newTitles[id] = res.data?.title || `Task #${id}`;
        } catch {
          newTitles[id] = `Task #${id}`;
        }
      }

      setTaskTitles((prev) => ({ ...prev, ...newTitles }));
    };

    if (items.length) loadTitles();
  }, [items, taskTitles]);

  // Load task details (modal)
  useEffect(() => {
    if (!selectedItem?.taskId) return;

    const loadTaskDetails = async () => {
      try {
        setTaskLoading(true);
        const res = await api.get(`/tasks/${selectedItem.taskId}`);
        setTaskDetails(res.data);
      } catch (err) {
        console.error("Failed to load task details:", err);
        setTaskDetails(null);
      } finally {
        setTaskLoading(false);
      }
    };

    loadTaskDetails();
  }, [selectedItem]);

  if (loading) {
    return <div className="deliverables-loading">Loading submissions...</div>;
  }

  const filteredItems = items.filter((item) => {
    const itemDate = item.createdAt ? new Date(item.createdAt) : null;
    if (fromDate && itemDate < new Date(fromDate)) return false;
    if (toDate && itemDate > new Date(toDate + "T23:59:59")) return false;
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
              <h4 className="submission-task-title">
                {taskTitles[item.taskId] || `Task #${item.taskId}`}
              </h4>

              <div className="submission-header">
                <div className="avatar">
                  {item.submittedByName?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="user-info">
                  <strong>{item.submittedByName || "Unknown"}</strong>
                  <span>submitted this task</span>
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
            </div>
          ))}
        </div>
      </div>

      {/* TASK DETAILS MODAL */}
      {selectedItem && (
        <div className="file-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div
            className="task-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-modal" onClick={() => setSelectedItem(null)}>
              ✖
            </button>

            <h2>{taskDetails?.title || `Task #${selectedItem.taskId}`}</h2>

            <p className="task-meta-line">
              Submitted by <strong>{selectedItem.submittedByName}</strong> •{" "}
              {new Date(selectedItem.createdAt).toLocaleString()}
            </p>

            {taskDetails && (
              <div className="task-meta-grid">
                <div>
                  <span>⏱ Time Spent</span>
                  <strong>
                    {taskDetails.timeSpent
                      ? `${taskDetails.timeSpent} min`
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>🏢 Company</span>
                  <strong>{taskDetails.company || "—"}</strong>
                </div>
                <div>
                  <span>📌 Type</span>
                  <strong>{taskDetails.type || "—"}</strong>
                </div>
              </div>
            )}

            {taskDetails?.description && (
              <div className="task-description-box">
                <h4>Description</h4>
                <div className="task-description-scroll">
                  {taskDetails.description}
                </div>
              </div>
            )}

            {/* ✅ FILES */}
            <div className="task-files-section">
              <h4>Attachments</h4>

              {selectedItem.files?.length ? (
                <div className="task-files-grid">
                  {selectedItem.files.map((file, i) => {
                    const isImage = file.url?.match(/\.(jpg|jpeg|png|gif)$/i);
                    const isVideo = file.url?.match(/\.(mp4|webm|ogg)$/i);

                    return (
                      <div
                        key={i}
                        className="task-file-card"
                        onClick={(e) => {
                          e.stopPropagation(); // 🔥 الحل
                          setSelectedFile(file);
                        }}
                      >
                        {isImage && <img src={file.url} alt="" />}
                        {isVideo && <video src={file.url} muted />}
                        {!isImage && !isVideo && (
                          <div className="file-generic">
                            📎 {file.originalName}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="no-files">No files attached</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FILE PREVIEW MODAL */}
      {selectedFile && (
        <div className="file-modal-overlay" onClick={() => setSelectedFile(null)}>
          <div className="file-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedFile(null)}>
              ✖
            </button>

            <h3>{selectedFile.originalName}</h3>
{selectedFile.mimeType?.startsWith("image/") ? (
  <img
    src={selectedFile.url}
    className="modal-image"
    alt={selectedFile.originalName}
  />
) : selectedFile.mimeType === "application/pdf" ? (
  <iframe
    src={selectedFile.url}
    className="modal-pdf"
    title={selectedFile.originalName}
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
