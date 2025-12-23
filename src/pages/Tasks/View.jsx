import React, { useEffect, useState } from "react";
import { getTaskById } from "../../services/tasksService";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../services/apiClient";
import "./view.css";

const ViewTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [deliverables, setDeliverables] = useState([]);
  const [uploadAttempted, setUploadAttempted] = useState(false);

  /* ================= LOAD TASK ================= */
  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const loadTask = async () => {
      try {
        const res = await getTaskById(id);
        if (!res?.data) setNotFound(true);
        else setTask(res.data);
      } catch (err) {
        if (err?.response?.status === 403) {
          alert("❌ غير مسموح لك بعرض هذه المهمة");
          navigate("/tasks");
          return;
        }
        setNotFound(true);
      }
      setLoading(false);
    };

    loadTask();
  }, [id, navigate]);

  /* ================= LOAD DELIVERABLES ================= */
  useEffect(() => {
    if (!id) return;

    const loadDeliverables = async () => {
      try {
        const res = await api.get(`/deliverables?taskId=${id}`);
        setDeliverables(res.data || []);
      } catch (err) {
        console.error("Failed to load deliverables", err);
      }
    };

    loadDeliverables();
  }, [id]);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!id || isNaN(Number(id))) return;

    const savedStart = localStorage.getItem("timer_start_" + id);
    const savedSeconds = localStorage.getItem("timer_seconds_" + id);

    let totalSeconds = savedSeconds ? Number(savedSeconds) : 0;

    if (savedStart) {
      const diff = Math.floor((Date.now() - Number(savedStart)) / 1000);
      totalSeconds += diff;
      setIsRunning(true);
    }

    setSeconds(totalSeconds);
  }, [id]);

  useEffect(() => {
    let interval = null;
    if (isRunning && id && !isNaN(Number(id))) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const updated = prev + 1;
          localStorage.setItem("timer_seconds_" + id, updated);
          return updated;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, id]);

  const startTimer = () => {
    localStorage.setItem("timer_start_" + id, Date.now());
    setIsRunning(true);
  };

  const pauseTimer = () => {
    localStorage.removeItem("timer_start_" + id);
    setIsRunning(false);
  };

  const finishTask = async () => {
    pauseTimer();
    const totalMinutes = Math.floor(seconds / 60);

    try {
      const res = await api.put(`/tasks/${id}/time`, {
        timeSpent: totalMinutes,
      });

      setTask((prev) => ({ ...prev, timeSpent: res.data.timeSpent }));
      alert("✅ Task finished! Time saved: " + totalMinutes + " min");

      setSeconds(0);
      setIsRunning(false);
      localStorage.removeItem("timer_start_" + id);
      localStorage.removeItem("timer_seconds_" + id);
    } catch {
      alert("❌ Error saving time");
    }
  };

  /* ================= UPLOAD ================= */
  const handleFileChange = (e) =>
    setSelectedFiles(Array.from(e.target.files));

  const uploadDeliverables = async () => {
    setUploadAttempted(true);

    if (!selectedFiles.length) return alert("❌ اختر ملفات أولاً");

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("taskId", id);
      selectedFiles.forEach((file) => formData.append("files", file));

      await api.post("/deliverables", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ تم رفع مخرجات المهمة بنجاح");
      setSelectedFiles([]);
    } catch {
      alert("❌ حدث خطأ أثناء رفع الملفات");
    } finally {
      setUploading(false);
    }
  };

  /* ================= HELPERS ================= */
  const formatTime = () => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatStoredTime = (min) =>
    !min || min <= 0 ? "—" : `${Math.floor(min / 60)}h ${min % 60}m`;

  /* ================= RENDER ================= */
  if (loading) return <div className="loading">Loading...</div>;
  if (notFound)
    return <h2 style={{ textAlign: "center" }}>❌ Task Not Found</h2>;

  const allFiles = deliverables.flatMap((d) => d.files || []);
  const visibleFiles = allFiles.slice(0, 2);
  const remainingCount = allFiles.length - 2;

  return (
    <div className="view-wrapper">
      <div className="view-card">

        {/* ===== HEADER ===== */}
        <div className="task-header">
          <h1 className="task-title">{task?.title || "—"}</h1>
          <div className="meta-section">
            <span className="badge badge-priority">{task?.priority}</span>
            <span className="badge badge-status">{task?.status}</span>
          </div>
        </div>

        {/* ===== TIMER PANEL ===== */}
        <div className="timer-box">
          <div className="timer-time">{formatTime()}</div>

          <div className="timer-actions">
            {!isRunning ? (
              <button className="timer-btn start" onClick={startTimer}>
                ▶ Start
              </button>
            ) : (
              <button className="timer-btn pause" onClick={pauseTimer}>
                ⏸ Pause
              </button>
            )}

            <button className="timer-btn finish" onClick={finishTask}>
              ✔ Finish
            </button>
          </div>

          <div className="upload-section">
            <label className="upload-label">
              📁 Choose files
              <input type="file" multiple onChange={handleFileChange} />
            </label>

            <span className="upload-info">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} file(s) selected`
                : "No files selected"}
            </span>

            <button
              className="timer-btn upload-btn"
              onClick={uploadDeliverables}
              disabled={uploading}
            >
              📤 رفع مخرجات المهمة
            </button>
          </div>

          {uploadAttempted &&
            deliverables.length > 0 &&
            deliverables.every(d => !d.files || d.files.length === 0) && (
              <p style={{ color: "#dc2626", marginTop: "10px" }}>
                ⚠️ تم إنشاء مخرجات لهذه المهمة، لكن لا توجد ملفات مرفوعة
              </p>
            )}

          {/* ===== الروابط القديمة (بقيت كما هي) ===== */}
          {deliverables.flatMap((d, i) =>
            d.files.map((file, idx) => (
              <a
                key={`${i}-${idx}`}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="deliverable-link"
              >
                📎 {file.originalName}
              </a>
            ))
          )}
        </div>

        {/* ===== INFO GRID ===== */}
        <div className="info-grid">

          <div className="info-item">
            <h3>Company</h3>
            <p>{task?.company || "—"}</p>
          </div>

          <div className="info-item">
            <h3>Task Type</h3>
            <p>{task?.type || "—"}</p>
          </div>

          <div className="info-item">
            <h3>Assigned To</h3>
            <p>{task?.workerName || "—"}</p>
          </div>

          <div className="info-item">
            <h3>Created At</h3>
            <p>{task?.createdAt ? new Date(task.createdAt).toLocaleString() : "—"}</p>
          </div>

          {/* ===== NEW ATTACHMENTS UI ===== */}
          <div className="info-item">
            <h3>Attachments</h3>

            <div className="attachments-box">
              {visibleFiles.map((file, i) => (
                <div className="attachment-card" key={i}>
                  <span className="remove-attachment">✖</span>

                  {file.mimeType?.startsWith("image/") ? (
                    <img src={file.url} alt="" />
                  ) : file.mimeType?.startsWith("video/") ? (
                    <video src={file.url} />
                  ) : (
                    <div className="file-icon">📄</div>
                  )}
                </div>
              ))}

              {remainingCount > 0 && (
                <div className="attachment-card more">
                  +{remainingCount}
                </div>
              )}

              {allFiles.length === 0 && (
                <span className="no-attachments">No attachments</span>
              )}
            </div>
          </div>

          <div className="info-item">
            <h3>Time Spent</h3>
            <p>{formatStoredTime(task?.timeSpent)}</p>
          </div>
        </div>

        {/* ===== DESCRIPTION ===== */}
        <div className="desc-section">
          <h2>Description</h2>
          <div
            className="desc-box"
            dangerouslySetInnerHTML={{
              __html: task?.description || "<i>No description</i>",
            }}
          />
        </div>

        {/* ===== ACTIONS ===== */}
        <div className="actions-row">
          <Link to={`/tasks/edit/${id}`} className="btn-edit">
            ✏ Edit Task
          </Link>
          <Link to="/tasks" className="btn-back">
            ← Back to Tasks
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ViewTask;
