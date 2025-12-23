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

  // ✅ عرض فقط
  const [previewFile, setPreviewFile] = useState(null);
  const [showAllAttachments, setShowAllAttachments] = useState(false);

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
          <div className="timer-time">
            {`${String(Math.floor(seconds / 3600)).padStart(2,"0")}:${String(Math.floor((seconds%3600)/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`}
          </div>

          <div className="timer-actions">
            {!isRunning ? (
              <button className="timer-btn start" onClick={startTimer}>▶ Start</button>
            ) : (
              <button className="timer-btn pause" onClick={pauseTimer}>⏸ Pause</button>
            )}
            <button className="timer-btn finish" onClick={finishTask}>✔ Finish</button>
          </div>

          <div className="upload-section">
            <label className="upload-label">
              📁 Choose files
              <input type="file" multiple onChange={handleFileChange} />
            </label>

            <span className="upload-info">
              {selectedFiles.length ? `${selectedFiles.length} file(s) selected` : "No files selected"}
            </span>

            <button className="timer-btn upload-btn" onClick={uploadDeliverables} disabled={uploading}>
              📤 رفع مخرجات المهمة
            </button>
          </div>
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

          {/* ===== ATTACHMENTS ===== */}
          <div className="info-item attachments">
            <h3>Attachments</h3>

            <div className="attachments-box">
              {visibleFiles.map((file, i) => (
                <div
                  key={i}
                  className="attachment-card"
                  onClick={() => setPreviewFile(file)}
                >
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
                <div
                  className="attachment-card more"
                  onClick={() => setShowAllAttachments(true)}
                >
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
            <p>{task?.timeSpent || "—"}</p>
          </div>
        </div>

      </div>

      {/* ===== PREVIEW MODAL ===== */}
      {previewFile && (
        <div className="file-modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="file-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setPreviewFile(null)}>✖</button>

            {previewFile.mimeType?.startsWith("image/") && (
              <img src={previewFile.url} alt="" style={{ maxWidth: "100%" }} />
            )}

            {previewFile.mimeType?.startsWith("video/") && (
              <video src={previewFile.url} controls style={{ maxWidth: "100%" }} />
            )}

            {!previewFile.mimeType?.startsWith("image/") &&
              !previewFile.mimeType?.startsWith("video/") && (
                <a href={previewFile.url} target="_blank" rel="noreferrer">
                  Download file
                </a>
              )}
          </div>
        </div>
      )}

      {/* ===== ALL ATTACHMENTS MODAL ===== */}
      {showAllAttachments && (
        <div className="file-modal-overlay" onClick={() => setShowAllAttachments(false)}>
          <div className="file-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowAllAttachments(false)}>✖</button>

            <div className="task-files-grid">
              {allFiles.map((file, i) => (
                <div
                  key={i}
                  className="task-file-card"
                  onClick={() => setPreviewFile(file)}
                >
                  {file.mimeType?.startsWith("image/") && <img src={file.url} alt="" />}
                  {file.mimeType?.startsWith("video/") && <video src={file.url} />}
                  {!file.mimeType?.startsWith("image/") &&
                    !file.mimeType?.startsWith("video/") && (
                      <div className="file-generic">📎 {file.originalName}</div>
                    )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewTask;
