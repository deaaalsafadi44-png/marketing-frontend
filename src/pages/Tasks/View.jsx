import React, { useEffect, useState } from "react";
// استبدل السطر القديم بهذا السطر الشامل
import { getTaskById, lockTaskApi, unlockTaskApi } from "../../services/tasksService";
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
  // 1. التعامل مع القيم الفارغة أو الصفرية
  if (!minutes || minutes <= 0) return "0s";

  // 2. تحويل الدقائق (التي قد تكون عشرية مثل 1.5) إلى إجمالي ثوانٍ حقيقية
  // نستخدم Math.round لتفادي أخطاء الكسور البسيطة في الجافاسكريبت
  const totalSeconds = Math.round(minutes * 60);

  // 3. حساب الساعات والدقائق والثواني من إجمالي الثواني
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  // 4. بناء النص النهائي للعرض بشكل مرن
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0) parts.push(`${s}s`);

  // 5. إذا كان الوقت أقل من دقيقة (ثوانٍ فقط)، نعرض الثواني
  // إذا كانت الدقائق والساعات صفر، نعرض 0s
  return parts.length > 0 ? parts.join(" ") : "0s";
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
  // 1. نافذة تأكيد للموظف
  if (!window.confirm("هل أنت متأكد من إنهاء المهمة؟ سيتم اعتماد المرفقات كـ 'تسليم نهائي' وقفل العداد.")) {
    return;
  }

  try {
    // 2. طلب القفل من السيرفر (يوقف التايمر ويقفل المهمة)
    const res = await lockTaskApi(id);

    if (res.data) {
      // 3. تحديث واجهة المستخدم فوراً
      setTask(res.data);
      setSeconds(res.data.timer?.totalSeconds || 0);
      setIsRunning(false);

      // 4. (اختياري لكن مفضل) تنبيه السيرفر لاعتماد التسليم
      // إذا كان السيرفر مبرمجاً على عرض المرفقات فقط للمهمات المقفلة، فهذا السطر كافٍ
      alert("✅ تم إنهاء المهمة واعتماد التسليم بنجاح.");
      
      // 5. الانتقال لصفحة التسليمات لمشاهدة النتيجة
      navigate("/submissions");
    }
  } catch (err) {
    console.error("Finish error:", err);
    alert("❌ فشل إنهاء المهمة، يرجى المحاولة مرة أخرى.");
  }
};/* ================= UPLOAD ================= */
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
    <button 
      className="timer-btn start" 
      onClick={startTimer} 
      disabled={task?.isLocked} // 🔒 قفل عند الانتهاء
    >
      ▶ Start
    </button>
  ) : (
    <button 
      className="timer-btn pause" 
      onClick={pauseTimer} 
      disabled={task?.isLocked} // 🔒 قفل عند الانتهاء
    >
      ⏸ Pause
    </button>
  )}
  
  <button 
    className="timer-btn finish" 
    onClick={finishTask} 
    disabled={task?.isLocked} // 🔒 الزر نفسه يقفل بعد استخدامه
  >
    ✔ Finish
  </button>
</div>
{/* زر فك القفل - تم تعديل الشرط ليتوافق مع بيانات النظام المتاحة */}
{task?.isLocked && (
  // التحقق من الاسم مباشرة لأنه يظهر في الواجهة كـ Super Admin
  task?.workerName === "Super Admin" || 
  // أو إذا كان هناك أي وسيلة أخرى يمررها النظام للأدمن
  localStorage.getItem("userRole") === "Admin" 
) && (
  <button 
    className="timer-btn unlock-btn" 
    style={{ 
      backgroundColor: "#e67e22", 
      marginTop: "10px", 
      width: "100%",
      display: "block", // لضمان أخذ المساحة كاملة
      opacity: 1,
      cursor: "pointer"
    }}
    onClick={async () => {
      if(window.confirm("هل أنت متأكد من فك قفل هذه المهمة؟ سيتمكن الموظف من تشغيل التايمر مرة أخرى.")) {
        try {
          const res = await unlockTaskApi(id);
          if (res.data) {
            setTask(res.data);
            setIsRunning(false);
            setSeconds(res.data.timer?.totalSeconds || 0);
            alert("🔓 تم فك القفل بنجاح.");
          }
        } catch (err) {
          console.error("Unlock error:", err);
          alert("❌ فشل فك القفل، تأكد من صلاحيات المشرف.");
        }
      }
    }}
  >
    🔓 Unlock Task (Admin Only)
  </button>
)}
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
  <p>
    <strong>{task?.workerName || "—"}</strong>
    {/* إضافة المسمى الوظيفي هنا بصيغة مميزة */}
    {task?.workerJobTitle && (
      <span className="worker-job-badge">
        {task.workerJobTitle}
      </span>
    )}
  </p>
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
  <p>
    {(() => {
      // 1. إذا كان العداد يعمل الآن، نأخذ الوقت من seconds
      if (isRunning && seconds > 0) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
      }
      
      // 2. إذا توقف العداد، نتحقق من وجود ثوانٍ مخزنة في بيانات المهمة نفسها
      if (task?.timer?.totalSeconds > 0) {
        const h = Math.floor(task.timer.totalSeconds / 3600);
        const m = Math.floor((task.timer.totalSeconds % 3600) / 60);
        const s = task.timer.totalSeconds % 60;
        return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
      }

      // 3. إذا لم يوجد ثوانٍ، نعود للدقائق التقليدية (للمهمات القديمة)
      return task?.timeSpent ? formatMinutes(task.timeSpent) : "0m 0s";
    })()}
  </p>
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