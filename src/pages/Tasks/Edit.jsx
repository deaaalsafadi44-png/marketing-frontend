import React, { useEffect, useState } from "react";
import {
  getTaskById,
  updateTaskApi,
  getOptions
} from "../../services/tasksService";
import { getUsers } from "../../services/usersService";
import { useParams, useNavigate } from "react-router-dom";
import "./edit.css";

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [options, setOptions] = useState({
    priority: [],
    status: [],
    companies: []
  });
  const [users, setUsers] = useState([]);
  const [task, setTask] = useState(null);

  useEffect(() => {
    // 🔒 منع الموظف
    if (user && user.role === "Employee") {
      alert("❌ غير مسموح للموظف تعديل المهام");
      navigate("/tasks");
      return;
    }

    // 🛡️ تحقق من ID
    if (!id || isNaN(Number(id))) {
      navigate("/tasks");
      return;
    }

    const loadData = async () => {
      try {
        const taskRes = await getTaskById(id);

        const cleanDescription = taskRes.data.description
          ?.replace(/<[^>]+>/g, "")
          .trim();

        setTask({
          ...taskRes.data,
          description: cleanDescription || ""
        });

        const optRes = await getOptions();
        setOptions({
          priority: optRes.data.priority || [],
          status: optRes.data.status || [],
          companies: optRes.data.companies || []
        });

        const usersRes = await getUsers();
        setUsers(usersRes.data || []);
      } catch (err) {
        console.error("Error loading edit page data:", err);

        if (err?.response?.status === 403) {
          alert("❌ غير مصرح لك بتعديل هذه المهمة");
        }

        navigate("/tasks");
      }
    };

    loadData();
  }, [id, navigate, user]);

  const handleChange = (e) => {
    setTask({ ...task, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      // ✨ تنظيف البيانات قبل الإرسال
      const {
        id: _id,
        createdAt,
        workerName,
        ...cleanTask
      } = task;

      await updateTaskApi(id, cleanTask);

      alert("Task updated successfully!");
      navigate(`/tasks/view/${id}`);
    } catch (err) {
      console.error("Error updating task:", err);

      if (err?.response?.status === 403) {
        alert("❌ فقط الأدمن أو المدير يمكنه تعديل المهام");
        return;
      }

      alert("❌ Failed to update task. Try again.");
    }
  };

  if (!task) return <div className="loading">Loading...</div>;

  return (
    <div className="edit-page">
      <div className="edit-card">
        <h2 className="card-title">✏️ Edit Task</h2>

        <form onSubmit={handleSave}>
          {/* Title */}
          <div className="form-group">
            <label>Task Title</label>
            <input
              type="text"
              name="title"
              value={task.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea
              className="simple-textarea"
              value={task.description}
              onChange={(e) =>
                setTask({ ...task, description: e.target.value })
              }
              rows="6"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
                resize: "vertical"
              }}
            />
          </div>

          {/* Company */}
          <div className="form-group">
            <label>Company</label>
            <select
              name="company"
              value={task.company}
              onChange={handleChange}
              required
            >
              <option value="">Select Company</option>
              {options.companies.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="form-group">
            <label>Task Type</label>
            <input
              type="text"
              name="type"
              value={task.type}
              onChange={handleChange}
              required
            />
          </div>

          {/* Assigned Worker */}
          <div className="form-group">
            <label>Assigned User</label>
            <select
              name="workerId"
              value={task.workerId}
              onChange={handleChange}
              required
            >
              <option value="">Select User</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.role}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="form-group">
            <label>Priority</label>
            <select
              name="priority"
              value={task.priority}
              onChange={handleChange}
              required
            >
              {options.priority.map((p, i) => (
                <option key={i} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={task.status}
              onChange={handleChange}
              required
            >
              {options.status.map((s, i) => (
                <option key={i} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <button className="save-btn">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

export default EditTask;
