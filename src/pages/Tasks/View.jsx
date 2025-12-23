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

  // ✅ NEW: deliverables state
  const [deliverables, setDeliverables] = useState([]);

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

      // ✅ Reload deliverables after upload
      const res = await api.get(`/deliverables?taskId=${id}`);
      setDeliverables(res.data || []);
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

          {/* ===== UPLOAD ===== */}
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
        </div>

        {/* ===== DELIVERABLES VIEW ===== */}
        <div className="deliverables-section">
          <h2>Task Deliverables</h2>

          {deliverables.length === 0 && (
            <p style={{ opacity: 0.6 }}>No deliverables uploaded yet.</p>
          )}

          <div className="deliverables-grid">
            {deliverables.flatMap((d, i) =>
              d.files.map((file, idx) => {
                if (file.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
                  return (
                    <img
                      key={`${i}-${idx}`}
                      src={file.url}
                      alt={file.originalName}
                      className="deliverable-img"
                    />
                  );
                }

                if (file.url.match(/\.(mp4|webm)$/i)) {
                  return (
                    <video
                      key={`${i}-${idx}`}
                      src={file.url}
                      controls
                      className="deliverable-video"
                    />
                  );
                }

                return (
                  <a
                    key={`${i}-${idx}`}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="deliverable-file"
                  >
                    📄 {file.originalName}
                  </a>
                );
              })
            )}
          </div>
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
