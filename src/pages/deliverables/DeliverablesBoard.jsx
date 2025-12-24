import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/apiClient";
import "./deliverables.css";

const DeliverablesBoard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // حالة تشمل تفاصيل المهمة (العنوان، الحالة، الوقت، والشركة)
  const [tasksData, setTasksData] = useState({});

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchCompany, setSearchCompany] = useState(""); // 🆕 حالة فلترة الشركة

  /* 🆕 current user */
  const [currentUser, setCurrentUser] = useState(null);

  const location = useLocation();

  /* ================= تنسيق الوقت المستغرق ================= */
  const formatMinutes = (minutes) => {
    if (!minutes || minutes <= 0) return "0 min";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

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

  /* ================= LOAD TASK DETAILS (Title, Status, Time, Company) ================= */
  useEffect(() => {
    const loadDetails = async () => {
      const missingIds = items
        .map((i) => i.taskId)
        .filter((id) => id && !tasksData[id]);

      if (!missingIds.length) return;

      const newDetails = {};

      for (const id of missingIds) {
        try {
          const res = await api.get(`/tasks/${id}`);
          newDetails[id] = {
            title: res.data?.title || `Task #${id}`,
            status: res.data?.status || "Unknown",
            timeSpent: res.data?.timeSpent || 0,
            company: res.data?.company || "No Company" 
          };
        } catch {
          newDetails[id] = { 
            title: `Task #${id}`, 
            status: "Error", 
            timeSpent: 0,
            company: "Error"
          };
        }
      }

      setTasksData((prev) => ({ ...prev, ...newDetails }));
    };

    if (items.length) loadDetails();
  }, [items, tasksData]);

  /* 🆕 استخراج قائمة الشركات الفريدة من البيانات المتاحة للفلترة */
  const companiesList = useMemo(() => {
    const companies = Object.values(tasksData)
      .map((d) => d.company)
      .filter((c) => c && c !== "No Company" && c !== "Error");
    return [...new Set(companies)]; // حذف التكرار
  }, [tasksData]);

  /* ================= FILTER LOGIC ================= */
  const filteredItems = items.filter((item) => {
    const detail = tasksData[item.taskId] || {};
    const itemDate = item.createdAt ? new Date(item.createdAt) : null;
    
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

  if (loading) {
    return <div className="deliverables-loading">Loading submissions...</div>;
  }

  return (
    <>
      <div className="deliverables-feed-page">
        <div className="deliverables-feed-header">
          <h1>Task Submissions</h1>
          <p>Live activity from your team</p>

          {/* ================= 🆕 FILTER BAR ================= */}
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

            {/* 🆕 حقل فلترة الشركة */}
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
            const detail = tasksData[task.taskId] || {};
            return (
              <div key={task.taskId} className="submission-card">
                <div className="submission-card-top-header">
                  <div className="title-section">
                    <h4 className="submission-task-title">
                      {detail.title || `Task #${task.taskId}`}
                    </h4>
                    <span className="company-badge">🏢 {detail.company}</span>
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
        // ✅ حماية: لا يتم تنفيذ التقييم إلا إذا كان Admin أو Manager
        if (isAdminOrManager) {
          handleRate(task, n);
        }
      }}
      style={{
        // ✅ حماية بصربة: تغيير شكل الماوس بناءً على الصلاحية
        cursor: isAdminOrManager ? "pointer" : "default",
        color: task.rating >= n ? "#facc15" : "#d1d5db",
        fontSize: "18px",
        userSelect: "none",
        opacity: isAdminOrManager ? 1 : 0.7 // تعتيم بسيط لإظهار أنها للعرض فقط
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
              </div>
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