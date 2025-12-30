import React, { useEffect, useState } from "react";
import { addTaskApi, getOptions } from "../../services/tasksService";
import { getUsers } from "../../services/usersService";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import "./add.css";

const AddTask = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [options, setOptions] = useState({
    priority: [],
    status: [],
    companies: [],
  });

  const [users, setUsers] = useState([]);

  const [task, setTask] = useState({
    title: "",
    description: "",
    company: "",
    type: "",
    workerId: "",
    priority: "",
    status: "",

    isScheduled: false,
    frequency: "none",
    startDate: "",
    nextRun: null,
  });

  const [loading, setLoading] = useState(true);
const [isSubmitting, setIsSubmitting] = useState(false);
const location = useLocation(); // لا تنسَ إضافة useLocation في الـ imports بالأعلى

useEffect(() => {
  // إذا جاء المستخدم من صفحة الجدولة، قم بتفعيل الجدولة تلقائياً
  if (location.state?.fromScheduled) {
    setTask(prev => ({
      ...prev,
      isScheduled: true,
      frequency: "daily", // أو أي قيمة افتراضية
      nextRun: new Date(new Date().setDate(new Date().getDate() + 1))
    }));
  }
}, [location.state]);
  /* ================= ROLE GUARD ================= */
  useEffect(() => {
    if (!user) return;

    const role =
      typeof user.role === "string"
        ? user.role.toLowerCase().trim()
        : user.role?.name?.toLowerCase().trim();

    if (!["admin", "manager"].includes(role)) {
      navigate("/unauthorized");
    }
  }, [navigate, user]);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const load = async () => {
      try {
        const ops = await getOptions();
        setOptions({
          priority: ops.data.priority || [],
          status: ops.data.status || [],
          companies: ops.data.companies || [],
        });

        const u = await getUsers();
        setUsers(u.data);
      } catch (err) {
        console.error("Error loading form data:", err);
        alert("❌ لا يمكن تحميل بيانات النموذج");
        navigate("/tasks");
      }
      setLoading(false);
    };

    load();
  }, [navigate]);
/* ================= HANDLERS ================= */

  // دالة التغيير العامة (للعنوان، الشركة، الأولويات، الحالة)
  const handleChange = (e) => {
    setTask({ ...task, [e.target.name]: e.target.value });
  };

  // ✅ الدالة الجديدة: مخصصة لاختيار الموظف لربط الـ Type تلقائياً
  const handleWorkerChange = (e) => {
    const selectedWorkerId = e.target.value;
    
    // البحث عن كائن الموظف المختار من قائمة المستخدمين لديك
    const selectedUser = users.find((u) => String(u.id) === String(selectedWorkerId));

    setTask((prev) => ({
      ...prev,
      workerId: selectedWorkerId,
      // مزامنة التايب مع قسم الموظف (dept) أو وضع قيمة افتراضية
      type: selectedUser ? (selectedUser.dept || "General") : "", 
    }));
  };
const handleScheduleChange = (e) => {
  const freq = e.target.value;
  
  setTask(prev => ({
    ...prev,
    frequency: freq,
    isScheduled: freq !== "none",
    // إذا لم تكن مجدولة نمسح التاريخ، وإذا كانت مجدولة نضع تاريخ اليوم كقيمة افتراضية
    startDate: freq !== "none" ? (prev.startDate || new Date().toISOString().split('T')[0]) : null
  }));
};
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true); 

  try {
    // 1. استخراج بيانات الموظف المختار كاملة
    const selectedUser = users.find((u) => String(u.id) === String(task.workerId));

    // 2. معالجة التواريخ لضمان التوافق مع السيرفر (UTC)
    let nextRunValue = null;
    
    if (task.isScheduled && task.startDate) {
      // تحويل تاريخ البداية المختار من الجهاز إلى كائن تاريخ حقيقي
      const dateObj = new Date(task.startDate);
      
      // التأكد من صحة التاريخ ثم تحويله لصيغة ISO String
      if (!isNaN(dateObj.getTime())) {
        nextRunValue = dateObj.toISOString(); 
      }
    }

    // 3. تجهيز البيانات النهائية للإرسال
    const finalTaskData = {
      ...task,
      workerName: selectedUser ? selectedUser.name : "",
      workerJobTitle: selectedUser ? selectedUser.dept : "",
      // نرسل التاريخ بصيغة ISO لكي يتعرف عليه MongoDB كـ Date وليس String
      nextRun: nextRunValue,
      // نضمن إرسال التاريخ المختار كـ ISO أيضاً لاتساق البيانات
      startDate: task.startDate ? new Date(task.startDate).toISOString() : null
    };

    console.log("📤 Sending Task Data:", finalTaskData);

    await addTaskApi(finalTaskData);
    alert("✅ Task Added Successfully!");
    
    if (task.isScheduled) {
      navigate("/tasks/scheduled");
    } else {
      navigate("/tasks");
    }

  } catch (err) {
    console.error("Error adding task:", err);
    alert("❌ Failed to add task. Check console for details.");
    setIsSubmitting(false); 
  }
};
  return (
    /* ✅ هذا هو الحل */
    <div className="page-content full-bg">
      <div className="add-page">
        <div className="add-card">
          <h2 className="card-title">📝 Add New Task</h2>

          <form onSubmit={handleSubmit}>
            {/* ===== TITLE ===== */}
            <div className="form-group">
              <label>Task Title</label>
              <input
                type="text"
                name="title"
                required
                onChange={handleChange}
              />
            </div>

            {/* ===== DESCRIPTION ===== */}
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                className="description-box"
                value={task.description}
                onChange={(e) =>
                  setTask({ ...task, description: e.target.value })
                }
              />
            </div>

            {/* ===== GRID FIELDS ===== */}
            <div className="form-grid">
              <div className="form-group">
                <label>Company</label>
                <select name="company" required onChange={handleChange}>
                  <option value="">Select Company</option>
                  {options.companies.map((c, i) => (
                    <option key={i} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
  <label>Task Type (Auto-filled)</label>
  <input
    type="text"
    name="type"
    value={task.type} 
    required
    readOnly // لمنع أي تعديل يدوي يخالف تخصص الموظف
    className="read-only-input" // يمكنك إضافة تنسيق CSS لجعله يبدو بلون رمادي
    style={{ backgroundColor: "#ececec", cursor: "not-allowed" }}
  />
</div>

            <div className="form-group">
  <label>Assigned User</label>
  <select 
    name="workerId" 
    required 
    value={task.workerId} // ربط القيمة بـ state لضمان التحديث اللحظي
    onChange={handleWorkerChange} // استخدام الدالة الجديدة التي تربط الموظف بقسمه
  >
    <option value="">Select User</option>
    {users.map((u) => (
      <option key={u.id} value={u.id}>
        {/* عرض اسم الموظف مع مسمى وظيفته (dept) لمساعدة المدير في الاختيار */}
        {u.name} — ({u.dept || "No Job Title"})
      </option>
    ))}
  </select>
</div>

              <div className="form-group">
                <label>Priority</label>
                <select name="priority" required onChange={handleChange}>
                  <option value="">Select Priority</option>
                  {options.priority.map((p, i) => (
                    <option key={i} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select name="status" required onChange={handleChange}>
                  <option value="">Select Status</option>
                  {options.status.map((s, i) => (
                    <option key={i} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
<div className="schedule-section" style={{ marginTop: "20px", padding: "15px", border: "1px dashed #ccc", borderRadius: "8px" }}>
  <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px" }}>
    🕒 Task Scheduling
  </label>
  
  <div className="form-grid">
    {/* اختيار التكرار */}
    <div className="form-group">
      <label>Frequency</label>
      <select 
        name="frequency" 
        value={task.frequency} 
        onChange={handleScheduleChange}
        className="schedule-select"
      >
        <option value="none">No Repeat (One-time Task)</option>
        <option value="daily">Repeat Daily</option>
        <option value="weekly">Repeat Weekly</option>
        <option value="monthly">Repeat Monthly</option>
      </select>
    </div>
{/* الحقل المطور: اختيار التاريخ والوقت بدقة */}
{task.frequency !== "none" && (
  <div className="form-group">
    <label>Start Date & Time (When to appear?)</label>
    <input 
      type="datetime-local" // 👈 التغيير هنا: من date إلى datetime-local
      name="startDate"
      // القيمة ستبقى مخزنة في task.startDate ولكنها ستحتوي على الوقت أيضاً
      value={task.startDate || ""} 
      required
      onChange={(e) => setTask({ ...task, startDate: e.target.value })}
      // يمنع اختيار وقت مضى (يأخذ التاريخ والوقت الحاليين)
      min={new Date().toISOString().slice(0, 16)} 
    />
  </div>
)}
  </div>
  
  {task.frequency !== "none" && (
    <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
      ℹ️ This task will remain hidden until <strong>{task.startDate || "the selected date"}</strong>. 
      {task.frequency !== "none" && ` Then it will repeat ${task.frequency}.`}
    </p>
  )}
</div>
<button 
  type="submit" 
  className="submit-btn" 
  // قفل الزر برمجياً لمنع الضغط المتكرر
  disabled={isSubmitting} 
  // اختيارياً: يمكنك إضافة تنسيق بسيط ليوضح للمستخدم أن الزر معطل
  style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
>
  {/* تغيير النص ليظهر للمستخدم أن العملية جارية */}
  {isSubmitting ? "Adding Task..." : "+ Add Task"}
</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTask;
