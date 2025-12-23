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

  // 🔥 NEW: deliverables for this task
  const [deliverables, setDeliverables] = useState([]);
  const [deliverablesLoading, setDeliverablesLoading] = useState(false);

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
        setDeliverablesLoading(true);
        const res = await api.get("/deliverables");
        const all = Array.isArray(res.data) ? res.data : res.data?.data || [];

        const filtered = all.filter(
          (d) => String(d.taskId) === String(id)
        );

        setDeliverables(filtered);
      } catch (err) {
        console.error("Failed to load deliverables", err);
      } finally {
        setDeliverablesLoading(false);
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
        {/* (لم ألمس أي شيء هنا) */}

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

        {/* ===== ATTACHMENTS ===== */}
        <div className="desc-section">
          <h2>Attachments</h2>

          {deliverablesLoading ? (
            <p>Loading files...</p>
          ) : deliverables.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No files attached</p>
          ) : (
            <div className="task-files-grid">
              {deliverables.flatMap((d) =>
                d.files.map((file, i) => {
                  const isImage = file.url.match(/\.(jpg|jpeg|png|gif)$/i);
                  const isVideo = file.url.match(/\.(mp4|webm|ogg)$/i);

                  return (
                    <div key={file.publicId + i} className="task-file-card">
                      {isImage && <img src={file.url} alt="" />}
                      {isVideo && (
                        <video src={file.url} controls />
                      )}
                      {!isImage && !isVideo && (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="file-generic"
                        >
                          📎 {file.originalName}
                        </a>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
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
