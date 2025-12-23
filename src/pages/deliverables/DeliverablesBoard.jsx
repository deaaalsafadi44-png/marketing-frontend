import React, { useEffect, useState, useMemo } from "react";
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
          taskId: item.taskId,
          submittedByName: item.submittedByName,
          createdAt: item.createdAt,
          files: [],
          notes: [],
        };
      }

      if (item.files?.length) {
        map[item.taskId].files.push(...item.files);
      }

      if (item.notes) {
        map[item.taskId].notes.push(item.notes);
      }
    });

    return Object.values(map);
  }, [filteredItems]);

  /* ================= HELPERS ================= */
  const getFileType = (file) => {
    if (file.resource_type) return file.resource_type;
    if (file.mimeType?.startsWith("image/")) return "image";
    if (file.mimeType?.startsWith("video/")) return "video";
    return "raw";
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
          {groupedItems.map((task) => (
            <div
              key={task.taskId}
              className="submission-card"
              onClick={() => setSelectedItem(task)}
            >
              <h4 className="submission-task-title">
                {taskTitles[task.taskId] || `Task #${task.taskId}`}
              </h4>

              <div className="submission-header">
                <div className="avatar">
                  {task.submittedByName?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="user-info">
                  <strong>{task.submittedByName}</strong>
                  <span>completed this task</span>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(file);
                      }}
                    >
                      {type === "image" && <img src={file.url} alt="" />}
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

      {/* FILE PREVIEW MODAL */}
      {selectedFile && (
        <div className="file-modal-overlay" onClick={() => setSelectedFile(null)}>
          <div className="file-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedFile(null)}>
              ✖
            </button>

            <h3>{decodeFileName(selectedFile.originalName)}</h3>

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
