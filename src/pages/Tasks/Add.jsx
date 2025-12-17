import React, { useEffect, useState } from "react";
import { addTaskApi, getOptions } from "../../services/tasksService";
import { getUsers } from "../../services/usersService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import "./add.css";

const AddTask = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ المصدر الصحيح

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

  // =============================
  // Role Guard (Admin + Manager)
  // =============================
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

  // =============================
  // Load Users + Options
  // =============================
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

  const handleChange = (e) => {
    setTask({ ...task, [e.target.name]: e.target.value });
  };

  // =============================
  // Submit New Task
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addTaskApi(task);
      alert("✅ Task Added Successfully!");
      navigate("/tasks");
    } catch (err) {
      console.error("Error adding task:", err);
      alert("❌ Failed to add task. Please try again.");
    }
  };

  if (loading) {
    return <h2 style={{ textAlign: "center", marginTop: 40 }}>Loading...</h2>;
  }

  return (
    <div className="add-page">
      <div className="add-card">
        <h2 className="card-title">📝 Add New Task</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Title</label>
            <input type="text" name="title" required onChange={handleChange} />
          </div>

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
            <label>Task Type</label>
            <input type="text" name="type" required onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Assigned User</label>
            <select name="workerId" required onChange={handleChange}>
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

          <button type="submit" className="submit-btn">
            + Add Task
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTask;
