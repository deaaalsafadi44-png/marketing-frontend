import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/apiClient";
import "./deliverables.css";

/* =============================================
    🛠️ دالة جلب الشعار (المسارات الموحدة)
   ============================================= */
const getCompanyLogo = (companyName) => {
  const name = companyName?.toLowerCase().trim();
  if (name === "laffah") return "/logos/laffah.png"; 
  if (name === "healthy family") return "/logos/healthyfamily.png"; 
  if (name === "syrian united co") return "/logos/syrian united co.png"; 
  return "/logos/laffah.png"; 
};

const DeliverablesBoard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);


  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchCompany, setSearchCompany] = useState(""); // 🆕 حالة فلترة الشركة

  /* 🆕 current user */
  const [currentUser, setCurrentUser] = useState(null);

  const location = useLocation();
// حالة لكتابة تعليق جديد (نخزنها كمصطلح: معرف المهمة -> نص التعليق)
const [commentTexts, setCommentTexts] = useState({});
  /* ================= تنسيق الوقت المستغرق ================= */
 const formatMinutes = (minutes) => {
  // 1. التحقق من وجود قيمة
  if (!minutes || minutes <= 0) return "0s";

  // 2. تحويل الدقائق العشرية (مثل 28.43) إلى إجمالي ثوانٍ حقيقية
  const totalSeconds = Math.round(minutes * 60);

  // 3. توزيع الثواني على ساعات، دقائق، وثوانٍ
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  // 4. بناء نص العرض المنسق
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0) parts.push(`${s}s`);

  // إذا كانت النتيجة أقل من ثانية، نعرض 0s
  return parts.length > 0 ? parts.join(" ") : "0s";
};

  /* ================= LOAD USER ================= */
/* ================= LOAD DATA ON START ================= */
  useEffect(() => {
    // 1. جلب بيانات المستخدم
    api
      .get("/auth/me")
      .then((res) => setCurrentUser(res.data?.user))
      .catch(() => setCurrentUser(null));

    // 2. ✅ تشغيل دالة جلب البيانات فوراً عند فتح الصفحة
    loadDeliverables(); 
  }, []);

  // ✅ التعديل هنا ليتناسب مع حالة الأحرف Admin و Manager
  const isAdminOrManager =
    currentUser?.role === "Admin" || currentUser?.role === "Manager";

  /* ================= LOAD DELIVERABLES ================= */
  const loadDeliverables = async () => {
    try {
      setLoading(true);
      const res = await api.get("/deliverables/submissions");
      // السيرفر الآن يرسل taskDetails مع كل عنصر
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load deliverables:", err);
    } finally {
      setLoading(false);
    }
  };
/* =====================================================
    🧹 كود تنظيف البيانات اليتيمة (النسخة النهائية المستقرة)
===================================================== */
useEffect(() => {
  const cleanupOrphanedSubmissions = async () => {
    // التأكد من وجود بيانات، وأن المستخدم مخول، وأن التحميل الأولي انتهى
    if (!loading && items.length > 0 && isAdminOrManager) {
      try {
        // 1. جلب قائمة التاسكات الحالية من السيرفر للتأكد من وجودها
        const tasksRes = await api.get("/tasks"); 
        
        // 2. إنشاء قائمة بمعرفات التاسكات الموجودة فعلياً
        const existingTaskIds = new Set(tasksRes.data.map(t => String(t.id || t._id)));

        // 3. فحص كل تسليم (Submission) موجود في الصفحة حالياً
        for (const item of items) {
          const currentId = String(item.taskId);

          // إذا كان معرف التاسك الخاص بالتسليم غير موجود في قائمة التاسكات الأصلية
          if (!existingTaskIds.has(currentId)) {
            console.warn(`🗑️ Cleaning old orphan deliverable: ${item.deliverableId}`);

            try {
              // حذفه من قاعدة البيانات عبر السيرفر
              await api.delete(`/deliverables/${item.deliverableId}`);
              
              // تحديث الواجهة فوراً لإزالة العنصر من أمامك
              setItems(prev => prev.filter(i => i.deliverableId !== item.deliverableId));
            } catch (delErr) {
              console.error("Failed to delete orphaned item:", item.deliverableId, delErr);
            }
          }
        }
      } catch (err) {
        console.error("Cleanup process failed to fetch tasks:", err);
      }
    }
  };

  cleanupOrphanedSubmissions();

  // نضع [loading] فقط لضمان تشغيلها مرة واحدة بعد انتهاء جلب البيانات الأولي
}, [loading]);

/* 🆕 استخراج قائمة الشركات الفريدة من البيانات المتاحة للفلترة */
  const companiesList = useMemo(() => {
    const companies = items.map(item => item.taskDetails?.company).filter(Boolean);
    return [...new Set(companies)];
  }, [items]);

  /* ================= FILTER LOGIC ================= */
  const filteredItems = items.filter((item) => {
const detail = item.taskDetails || {};    const itemDate = item.createdAt ? new Date(item.createdAt) : null;
    
    // فلتر التاريخ
    if (itemDate) {
      if (fromDate && itemDate < new Date(fromDate)) return false;
      if (toDate && itemDate > new Date(toDate + "T23:59:59")) return false;
    }

    // فلتر اسم صاحب التاسك
    if (
      searchName &&
      !item.submittedByName?.toLowerCase().includes(searchName.toLowerCase())
    ) {
      return false;
    }

    // 🆕 فلتر الشركة
    if (searchCompany && detail.company !== searchCompany) {
      return false;
    }

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
        taskDetails: item.taskDetails 
      };
    }

    if (item.files?.length) {
      map[item.taskId].files.push(...item.files);
    }
  });

  // ✅ نستخدم sort لضمان الترتيب حسب التاريخ (من الأحدث للأقدم)
  return Object.values(map).sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}, [filteredItems]);

  const handleRate = async (task, value) => {
    if (!isAdminOrManager) return;

    const newRating = task.rating === value ? 0 : value;

    // تحديث الحالة محلياً فوراً
    setItems((prev) =>
      prev.map((i) =>
        i.taskId === task.taskId // التغيير هنا ليعتمد على taskId
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
      loadDeliverables(); // إعادة التحميل من السيرفر في حال الفشل
    }
  };
/* ================= ADD COMMENT FUNCTION ================= */
const handleAddComment = async (taskId) => {
  const text = commentTexts[taskId];
  if (!text || !text.trim()) return;

  try {
    await api.post(`/tasks/${taskId}/comments`, { text });
    
    // مسح صندوق النص بعد الإرسال
    setCommentTexts(prev => ({ ...prev, [taskId]: "" }));

    // ✅ تحديث الصفحة فوراً لجلب التعليقات الجديدة من السيرفر
    loadDeliverables(); 
  } catch (err) {
    console.error("Failed to add comment:", err);
    alert("Error adding comment.");
  }
};
/* ✅ اضف الدالة هنا - قبل الـ return مباشرة */
const handleDeleteComment = async (taskId, commentId) => {
  if (!window.confirm("Are you sure you want to delete this comment?")) return;

  try {
    await api.delete(`/tasks/${taskId}/comments/${commentId}`);

    // ✅ تحديث البيانات من السيرفر لتعكس الحذف فوراً
    loadDeliverables(); 
  } catch (err) {
    console.error("Failed to delete comment:", err);
    alert("Error deleting comment.");
  }
}


  /* ================= HELPERS ================= */
  const getFileType = (file) => {
    const url = file.url?.toLowerCase() || "";
    const name = file.originalName?.toLowerCase() || "";
    
    if (url.endsWith(".pdf") || name.endsWith(".pdf") || file.mimeType === "application/pdf") {
      return "pdf";
    }
    if (file.resource_type === "image" || file.mimeType?.startsWith("image/")) return "image";
    if (file.resource_type === "video" || file.mimeType?.startsWith("video/")) return "video";
    return "raw";
  };

  const handleFileClick = (file) => {
    const type = getFileType(file);
    if (type === "pdf") {
      window.open(file.url, '_blank', 'noopener,noreferrer');
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
/* ✅ أضف هذا الجزء هنا بالضبط */
  if (loading) {
    return <div className="deliverables-loading">Loading submissions...</div>;
  }

  return (
    <>
      <div className="deliverables-feed-page">
        <div className="deliverables-feed-header">
          <h1>Task Submissions</h1>
          <p>Live activity from your team</p>

          {/* ================= FILTER BAR ================= */}
          <div className="feed-filters-bar">
            <div className="filter-group">
              <label>Owner Name</label>
              <input 
                type="text" 
                placeholder="Search by name..." 
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Company</label>
              <select 
                value={searchCompany} 
                onChange={(e) => setSearchCompany(e.target.value)}
              >
                <option value="">All Companies</option>
                {companiesList.map((comp) => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>From Date</label>
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>To Date</label>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <button 
              className="reset-filters" 
              onClick={() => { 
                setSearchName(""); 
                setSearchCompany(""); 
                setFromDate(""); 
                setToDate(""); 
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="deliverables-feed">
          {groupedItems.map((task) => {
const detail = task.taskDetails || {};            return (
              <div key={task.taskId} className="submission-card">
                <div className="submission-card-top-header">
                  <div className="title-section">
                    <h4 className="submission-task-title">
                      {detail.title || `Task #${task.taskId}`}
                    </h4>
                    
                    {/* ✅ إضافة لوغو الشركة بجانب اسم الشركة في البطاقة */}
                    <div className="company-badge-container" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <img 
                        src={getCompanyLogo(detail.company)} 
                        alt="logo" 
                        style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'contain', border: '1px solid #eee', backgroundColor: '#fff' }}
                      />
                      <span className="company-badge" style={{ margin: 0 }}>{detail.company}</span>
                    </div>
                  </div>
                  
                  <div className="task-info-badges">
                    <span className={`status-badge ${detail.status?.toLowerCase()}`}>
                      {detail.status}
                    </span>
                    <span className="time-spent-badge">
                      ⏱ {formatMinutes(detail.timeSpent)}
                    </span>
                  </div>
                </div>

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
                            if (isAdminOrManager) {
                              handleRate(task, n);
                            }
                          }}
                          style={{
                            cursor: isAdminOrManager ? "pointer" : "default",
                            color: task.rating >= n ? "#facc15" : "#d1d5db",
                            fontSize: "18px",
                            userSelect: "none",
                            opacity: isAdminOrManager ? 1 : 0.6
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
                        
                        {type === "pdf" && (
                          <div className="file-generic pdf-style">
                            <div className="pdf-icon">📄</div>
                            <div className="pdf-text">PDF Document</div>
                            <span className="file-name-small">{decodeFileName(file.originalName)}</span>
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

                {/* ✅ هذا هو المكان الصحيح تماماً لضمان ظهوره داخل كل كارت */}
                <div className="comments-section" style={{ borderTop: '1px solid #f0f0f0', marginTop: '15px', paddingTop: '15px' }}>
                  
                {/* 1. عرض التعليقات القديمة */}
<div className="comments-list" style={{ marginBottom: (detail.comments?.length > 0) ? '15px' : '0' }}>
{detail.comments?.map((c) => 
  (  <div key={c._id} className="comment-item"  style={{ 
      marginBottom: '10px', 
      fontSize: '13px',
      display: 'flex', 
      justifyContent: 'space-between', // لجعل زر الحذف على اليمين والنص على اليسار
      alignItems: 'flex-start',
      background: '#f9f9f9',
      padding: '8px',
      borderRadius: '8px'
    }}>
      <div>
        <span style={{ fontWeight: 'bold', color: '#333' }}>{c.author}: </span>
        <span style={{ color: '#555' }}>{c.text}</span>
        <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
          {new Date(c.createdAt).toLocaleString()}
        </div>
      </div>

      {/* ✅ زر الحذف - يظهر فقط للأدمن والمانجر */}
      {isAdminOrManager && (
        <button
          onClick={() => handleDeleteComment(task.taskId, c._id)} // نستخدم الـ _id الخاص بالتعليق
          style={{
            background: 'none',
            border: 'none',
            color: '#ff4d4f',
            fontSize: '11px',
            cursor: 'pointer',
            padding: '0 5px',
            opacity: 0.7
          }}
          onMouseEnter={(e) => e.target.style.opacity = 1}
          onMouseLeave={(e) => e.target.style.opacity = 0.7}
        >
          Delete
        </button>
      )}
    </div>
  ))}
</div>

                  {/* 2. صندوق إضافة تعليق */}
                  {isAdminOrManager && (
                    <div className="comment-input-wrapper" style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Write a feedback..."
                        value={commentTexts[task.taskId] || ""}
                        onChange={(e) => setCommentTexts(prev => ({ ...prev, [task.taskId]: e.target.value }))}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '20px',
                          border: '1px solid #ddd',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(task.taskId)}
                      />
                      <button 
                        onClick={() => handleAddComment(task.taskId)}
                        style={{
                          backgroundColor: '#000',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 15px',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
                {/* ✅ نهاية قسم التعليقات */}

              </div> // نهاية الـ submission-card
            );
          })}
        </div>
      </div>
      {/* ================= FILE MODAL ================= */}
      {selectedFile && getFileType(selectedFile) !== "pdf" && (
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
              <video 
                key={selectedFile.url} 
                src={selectedFile.url} 
                controls 
                autoPlay 
                style={{
                  width: "100%",
                  maxHeight: "75vh",
                  display: "block",
                  margin: "0 auto",
                  borderRadius: "12px",
                  backgroundColor: "#000"
                }}
              />
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