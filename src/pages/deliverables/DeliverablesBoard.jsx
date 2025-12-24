import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/apiClient";
import "./deliverables.css";

const DeliverablesBoard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [taskTitles, setTaskTitles] = useState({});

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchName, setSearchName] = useState("");

  /* 🆕 current user */
  const [currentUser, setCurrentUser] = useState(null);

  const location = useLocation();

  /* ================= LOAD USER ================= */
  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setCurrentUser(res.data?.user))
      .catch(() => setCurrentUser(null));
  }, []);

  const isAdminOrManager =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  /* ================= LOAD DELIVERABLES ================= */
  const loadDeliverables = async () => {
    try {
      setLoading(true);
      const res = await api.get("/deliverables/submissions");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load deliverables:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliverables();
  }, [location.pathname]);

  /* ================= LOAD TASK TITLES ================= */
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

  /* ================= FILTER ================= */
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

  /* ================= GROUP BY TASK ================= */
  const groupedItems = useMemo(() => {
    const map = {};

    filteredItems.forEach((item) => {
      if (!map[item.taskId]) {
        map[item.taskId] = {
          deliverableId: item.deliverableId,
          taskId: item.taskId,
          submittedByName: item.submittedByName,
          createdAt: item.createdAt,
          files: [],
          rating: item.rating || 0,
        };
      }

      if (item.files?.length) {
        map[item.taskId].files.push(...item.files);
      }
    });

    return Object.values(map);
  }, [filteredItems]);

  /* ================= RATE ================= */
  const handleRate = async (task, value) => {
    const newRating = task.rating === value ? 0 : value;

    setItems((prev) =>
      prev.map((i) =>
        i.deliverableId === task.deliverableId
          ? { ...i, rating: newRating }
          : i
      )
    );

    try {
      await api.post(`/deliverables/${task.deliverableId}/rate`, {
        rating: newRating,
      });
    } catch (err) {
      console.error("Rating failed", err);

      setItems((prev) =>
        prev.map((i) =>
          i.deliverableId === task.deliverableId
            ? { ...i, rating: task.rating }
            : i
        )
      );
    }
  };

  /* ================= HELPERS (UPDATED) ================= */
  const getFileType = (file) => {
    const url = file.url?.toLowerCase() || "";
    if (file.resource_type === "image" || file.mimeType?.startsWith("image/")) return "image";
    if (file.resource_type === "video" || file.mimeType?.startsWith("video/")) return "video";
    if (url.endsWith(".pdf") || file.mimeType === "application/pdf") return "pdf";
    return "raw";
  };

  const handleFileClick = (file) => {
    const type = getFileType(file);
    if (type === "pdf") {
      // فتح الـ PDF مباشرة في صفحة جديدة تماماً كما في صفحة الـ View
      const safeUrl = file.url.replace('/upload/', '/upload/fl_attachment/');
      window.open(safeUrl, '_blank');
    } else {
      setSelectedFile(file);
    }
  };

  const decodeFileName = (name) => {
    try {
      return decodeURIComponent(escape(name));
    } catch {
      return name;
    }
  };

  if (loading) {
    return <div className="deliverables-loading">Loading submissions...</div>;
  }

  return (
    <>
      <div className="deliverables-feed-page">
        <div className="deliverables-feed-header">
          <h1>Task Submissions</h1>
          <p>Live activity from your team</p>
        </div>

        <div className="deliverables-feed">
          {groupedItems.map((task) => (
            <div key={task.taskId} className="submission-card">
              <h4 className="submission-task-title">
                {taskTitles[task.taskId] || `Task #${task.taskId}`}
              </h4>

              <div className="submission-header">
                <div className="avatar">
                  {task.submittedByName?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="user-info">
                  <strong>{task.submittedByName}</strong>

                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRate(task, n);
                        }}
                        style={{
                          cursor: "pointer",
                          color: task.rating >= n ? "#facc15" : "#d1d5db",
                          fontSize: "18px",
                          userSelect: "none",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <div className="date">
                  {task.createdAt
                    ? new Date(task.createdAt).toLocaleDateString()
                    : "—"}
                </div>
              </div>

              <div className="task-files-grid">
                {task.files.map((file, i) => {
                  const type = getFileType(file);
                  return (
                    <div
                      key={i}
                      className="task-file-card"
                      onClick={() => handleFileClick(file)}
                    >
                      {type === "image" && <img src={file.url} alt="" />}
                      {/* عرض صورة مصغرة للـ PDF إذا أمكن، وإلا أيقونة */}
                      {type === "pdf" && (
                        <div className="file-preview-wrapper">
                           <img src={file.url.replace(/\.pdf$/i, ".jpg")} alt="PDF Preview" onError={(e) => e.target.style.display='none'} />
                           <div className="file-icon-overlay">PDF</div>
                        </div>
                      )}
                      {type === "video" && <video src={file.url} muted />}
                      {type === "raw" && (
                        <div className="file-generic">
                          📎 {decodeFileName(file.originalName)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= FILE MODAL ================= */}
      {selectedFile && (
        <div
          className="file-modal-overlay"
          onClick={() => setSelectedFile(null)}
        >
          <div className="file-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedFile(null)}>
              ✖
            </button>

            <h3>{decodeFileName(selectedFile.originalName)}</h3>

            {getFileType(selectedFile) === "image" && (
              <img
                src={selectedFile.url}
                alt={selectedFile.originalName}
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  display: "block",
                  margin: "0 auto",
                  objectFit: "contain",
                }}
              />
            )}

            {getFileType(selectedFile) === "video" && (
              <video src={selectedFile.url} controls autoPlay />
            )}

            {getFileType(selectedFile) === "raw" && (
              <a href={selectedFile.url} target="_blank" rel="noreferrer">
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