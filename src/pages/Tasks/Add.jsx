import React, { useEffect, useState } from "react";
import { addTaskApi, getOptions } from "../../services/tasksService";
import { getUsers } from "../../services/usersService";
import { useNavigate } from "react-router-dom";
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
  });

  const [loading, setLoading] = useState(true);

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
const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addTaskApi(task);
      alert("✅ Task Added Successfully!");
      navigate("/tasks");
    } catch (err) {
      console.error("Error adding task:", err);
      alert("❌ Failed to add task.");
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

            {/* ===== SUBMIT ===== */}
            <button type="submit" className="submit-btn">
              + Add Task
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTask;
