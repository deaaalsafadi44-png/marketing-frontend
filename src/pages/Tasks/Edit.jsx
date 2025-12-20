import React, { useEffect, useState } from "react";
import {
  getTaskById,
  updateTaskApi,
  getOptions
} from "../../services/tasksService";
import { getUsers } from "../../services/usersService";
import { useParams, useNavigate } from "react-router-dom";


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

  const [task, setTask] = useState({
    title: "",
    description: "",
    company: "",
    type: "",
    workerId: "",
    priority: "",
    status: ""
  });

  useEffect(() => {
    if (user && user.role === "Employee") {
      alert("❌ غير مسموح للموظف تعديل المهام");
      navigate("/tasks");
      return;
    }

    if (!id || isNaN(Number(id))) {
      navigate("/tasks");
      return;
    }

    const loadData = async () => {
      try {
        const taskRes = await getTaskById(id);

        const cleanDescription =
          taskRes.data.description
            ?.replace(/<[^>]+>/g, "")
            .trim() || "";

        setTask({
          title: taskRes.data.title || "",
          description: cleanDescription,
          company: taskRes.data.company || "",
          type: taskRes.data.type || "",
          workerId: Number(taskRes.data.workerId) || "",
          priority: taskRes.data.priority || "",
          status: taskRes.data.status || ""
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
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setTask((prev) => ({
      ...prev,
      [name]: name === "workerId" ? Number(value) : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      await updateTaskApi(id, task);
      alert("✅ Task updated successfully!");
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

  return (
    <div className="add-page">
      <div className="add-card">
        <h2 className="card-title">✏️ Edit Task</h2>

        <form onSubmit={handleSave}>
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

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              className="description-box"
              value={task.description}
              onChange={handleChange}
            />
          </div>

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

          <button type="submit" className="submit-btn">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditTask;
