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

  // الحالة الآن تُدار عبر مزامنة السيرفر
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const formatMinutes = (minutes) => {
    if (!minutes || minutes <= 0) return "0 min";

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [deliverables, setDeliverables] = useState([]);
  const [uploadAttempted, setUploadAttempted] = useState(false);

  // ✅ عرض فقط
  const [previewFile, setPreviewFile] = useState(null);
  const [showAllAttachments, setShowAllAttachments] = useState(false);

  /* ================= LOAD TASK & SYNC TIMER ================= */
  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const loadTask = async () => {
      try {
        const res = await getTaskById(id);
        if (!res?.data) {
          setNotFound(true);
        } else {
          setTask(res.data);
          
          // مزامنة العداد من بيانات السيرفر مباشرة عند التحميل
          if (res.data.timer) {
            setSeconds(res.data.timer.totalSeconds || 0);
            setIsRunning(res.data.timer.isRunning || false);
          }
        }
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

  /* ================= TIMER LOGIC (CLIENT-SIDE TICK) ================= */
  useEffect(() => {
    let interval = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  /* ================= TIMER ACTIONS (SERVER-SYNC) ================= */
  const startTimer = async () => {
    try {
      const res = await api.post(`/tasks/${id}/timer/start`);
      // نحدث الحالة بناءً على رد السيرفر لضمان الدقة
      setSeconds(res.data.timer.totalSeconds);
      setIsRunning(true);
    } catch (err) {
      alert("❌ فشل تشغيل العداد");
    }
  };

  const pauseTimer = async () => {
    try {
      const res = await api.post(`/tasks/${id}/timer/pause`);
      // نحدث الحالة بناءً على الوقت الذي تم حفظه في السيرفر
      setSeconds(res.data.timer.totalSeconds);
      setIsRunning(false);
    } catch (err) {
      alert("❌ فشل إيقاف العداد");
    }
  };

  const finishTask = async () => {
    // نقوم بإيقاف العداد في السيرفر أولاً
    await pauseTimer();

    // نستخدم الوقت الحالي في الواجهة لإرساله كدقائق
    const totalMinutes = Math.floor(seconds / 60);

    try {
      const res = await api.put(`/tasks/${id}/time`, {
        timeSpent: totalMinutes,
      });

      // ✅ أضف هذا السطر هنا لتصفير التايمر داخل قاعدة بيانات السيرفر
      await api.post(`/tasks/${id}/timer/reset`); 

      setTask((prev) => ({ ...prev, timeSpent: res.data.timeSpent }));
      alert("✅ Task finished! Time saved: " + totalMinutes + " min");

      // تصفير العداد المحلي بعد النجاح
      setSeconds(0);
      setIsRunning(false);
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
      // إعادة تحميل المخرجات لتظهر فوراً
      const res = await api.get(`/deliverables?taskId=${id}`);
      setDeliverables(res.data || []);
    } catch {
      alert("❌ حدث خطأ أثناء رفع الملفات");
    } finally {
      setUploading(false);
    }
  };

  /* ================= DELETE FILE ================= */
  const handleDeleteFile = async (file) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الملف؟")) return;

    try {
      await api.delete(
        `/deliverables/${file.deliverableId}/files/${file._id}`
      );

      setDeliverables((prev) =>
        prev.map((d) =>
          d._id === file.deliverableId
            ? { ...d, files: d.files.filter((f) => f._id !== file._id) }
            : d
        )
      );
    } catch (err) {
      alert("❌ فشل حذف الملف");
      console.error(err);
    }
  };

  /* ================= FILE HELPER ================= */
  const handleFilePreview = (file) => {
    const url = file.url?.toLowerCase() || "";
    const name = file.originalName?.toLowerCase() || "";
    const isPDF = url.endsWith(".pdf") || name.endsWith(".pdf") || file.mimeType === "application/pdf";
    
    if (isPDF) {
      window.open(file.url, '_blank', 'noopener,noreferrer');
    } else {
      setPreviewFile(file);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (notFound)
    return <h2 style={{ textAlign: "center" }}>❌ Task Not Found</h2>;

  const allFiles = deliverables.flatMap((d) =>
    (d.files || []).map((file) => ({
      ...file,
      deliverableId: d._id,
    }))
  );

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

        {/* ===== TIMER PANEL (UPDATED) ===== */}
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
          <div className="info-item attachments">
            <h3>Attachments</h3>
            <div className="attachments-box">
              {visibleFiles.map((file, i) => (
                <div
                  key={i}
                  className="attachment-card"
                  onClick={() => handleFilePreview(file)}
                >
                  <span
                    className="remove-attachment"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file);
                    }}
                  >
                    ✖
                  </span>

                  {file.mimeType?.startsWith("image/") ? (
                    <img src={file.url} alt="" />
                  ) : (file.url?.toLowerCase().endsWith('.pdf') || file.mimeType === "application/pdf") ? (
                    <div className="file-icon">📄</div>
                  ) : file.mimeType?.startsWith("video/") ? (
                    <video src={file.url} />
                  ) : (
                    <div className="file-icon">📁</div>
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
            <p>{task?.timeSpent ? formatMinutes(task.timeSpent) : "—"}</p>
          </div>
        </div>
      </div>

      {/* ===== PREVIEW MODAL ===== */}
      {previewFile && (
        <div className="file-modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="file-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setPreviewFile(null)}>✖</button>

            {previewFile.mimeType?.startsWith("image/") && (
              <img src={previewFile.url} alt="" style={{ maxWidth: "100%", borderRadius: "8px" }} />
            )}

            {previewFile.mimeType?.startsWith("video/") && (
              <video src={previewFile.url} controls style={{ maxWidth: "100%", borderRadius: "8px" }} />
            )}

            {!previewFile.mimeType?.startsWith("image/") &&
              !previewFile.mimeType?.startsWith("video/") && (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ fontSize: "60px", marginBottom: "15px" }}>📄</div>
                  <p style={{ marginBottom: "20px", fontWeight: "bold", color: "#fff" }}>
                    {previewFile.originalName || "Download Document"}
                  </p>
                  <button 
                    className="timer-btn finish" 
                    style={{ width: "auto", padding: "10px 25px" }}
                    onClick={() => {
                      window.open(previewFile.url, '_blank');
                      setPreviewFile(null);
                    }}
                  >
                    Open File
                  </button>
                </div>
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
                  onClick={() => handleFilePreview(file)}
                >
                  <span
                    className="remove-attachment"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file);
                    }}
                  >
                    ✖
                  </span>

                  {file.mimeType?.startsWith("image/") && <img src={file.url} alt="" />}
                  {(file.url?.toLowerCase().endsWith('.pdf') || file.mimeType === "application/pdf") && <div className="file-generic">📄 PDF</div>}
                  {file.mimeType?.startsWith("video/") && <video src={file.url} />}
                  {!file.mimeType?.startsWith("image/") &&
                    !file.mimeType?.startsWith("video/") &&
                    !(file.url?.toLowerCase().endsWith('.pdf') || file.mimeType === "application/pdf") && (
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