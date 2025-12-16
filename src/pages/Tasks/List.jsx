import { useEffect, useState } from "react";
import {
  getTasks,
  deleteTaskApi,
  updateTaskApi,
  getOptions,
} from "../../services/tasksService";
import "./tasks.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const TasksList = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /* =========================
     ✅ AUTH (بدون localStorage)
     ========================= */
  const { user, loading: authLoading } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusOptions, setStatusOptions] = useState([]);

  /* =========================
     🛡 Helpers
     ========================= */
  const safeLower = (val) => String(val || "").toLowerCase();

  const safeDate = (val) => {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "New":
        return "#2196f3";
      case "Accepted":
        return "#9c27b0";
      case "In Progress":
        return "#fbc02d";
      case "Under Review":
        return "#ff9800";
      case "Approved":
        return "#4caf50";
      default:
        return "#555";
    }
  };

  const normalizeClass = (text) => {
    return safeLower(text).replace(/\s+/g, "-") || "default";
  };

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  /* =========================
     📥 Load Tasks
     ========================= */
  const loadTasks = async () => {
    try {
      const res = await getTasks();
      setTasks(res.data || []);

      const opt = await getOptions();
      setStatusOptions(opt.data?.status || []);
    } catch (err) {
      console.error("Error loading tasks:", err);
      if (err?.response?.status === 403) {
        navigate("/unauthorized", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadTasks();
    }

    if (location.state?.refresh) {
      navigate("/tasks", { replace: true, state: {} });
    }
  }, [authLoading, user, location.state]);

  /* =========================
     ✏️ Update Status
     ========================= */
  const handleStatusChange = async (taskId, newStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      await updateTaskApi(taskId, { ...task, status: newStatus });
      loadTasks();
    } catch (err) {
      console.error("Status update error:", err);
      if (err?.response?.status === 403) {
        alert("❌ لا تملك صلاحية تعديل الحالة");
      }
    }
  };

  /* =========================
     🗑 Delete Task
     ========================= */
  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTaskApi(taskId);
      loadTasks();
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ لا تملك صلاحية حذف المهمة");
    }
  };

  /* =========================
     🔍 Filtering
     ========================= */
  const filteredTasks = tasks.filter((task) => {
    const created = safeDate(task.createdAt);

    return (
      (companyFilter === "" || task.company === companyFilter) &&
      (statusFilter === "" || task.status === statusFilter) &&
      safeLower(task.type).includes(safeLower(search)) &&
      (!dateFrom || (created && created >= new Date(dateFrom))) &&
      (!dateTo || (created && created <= new Date(dateTo + " 23:59:59")))
    );
  });

  /* =========================
     ⏳ Guards
     ========================= */
  if (authLoading || loading) {
    return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
  }

  if (!user) return null;

  /* =========================
     🖥 UI
     ========================= */
  return (
    <div className="tasks-container">
      <h1 className="tasks-title">
        Tasks List ({filteredTasks.length} Total)
      </h1>

      <div className="filters-row">
        <select onChange={(e) => setCompanyFilter(e.target.value)}>
          <option value="">Company</option>
          {[...new Set(tasks.map((t) => t.company).filter(Boolean))].map(
            (company, i) => (
              <option key={i} value={company}>
                {company}
              </option>
            )
          )}
        </select>

        <input type="date" onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" onChange={(e) => setDateTo(e.target.value)} />

        <select onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Status</option>
          {statusOptions.map((s, i) => (
            <option key={i} value={s}>
              {s}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search task..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      {(user.role === "Admin" || user.role === "Manager") && (
  <Link to="/tasks/add" className="add-task-btn">
    + Add New Task
  </Link>
)}

      </div>

      <table className="tasks-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Company</th>
            <th>Type</th>
            <th>Worker</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredTasks.map((task) => (
            <tr key={task.id}>
              <td>{task.id}</td>
              <td>{task.company || "—"}</td>
              <td>{task.type || "—"}</td>
              <td>{task.workerName || "—"}</td>

              <td>
                <span className={`tag tag-${normalizeClass(task.priority)}`}>
                  {task.priority || "—"}
                </span>
              </td>

              <td>
                <select
                  value={task.status || ""}
                  onChange={(e) =>
                    handleStatusChange(task.id, e.target.value)
                  }
                  style={{
                    backgroundColor: getStatusColor(task.status),
                    color: "#fff",
                  }}
                >
                  {statusOptions.map((s, i) => (
                    <option key={i} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>

              <td>
                <Link to={`/tasks/view/${task.id}`} className="view-link">
                  View
                </Link>

                {(user.role === "Admin" || user.role === "Manager") && (
                  <>
                    {" | "}
                    <Link
                      to={`/tasks/edit/${task.id}`}
                      className="edit-link"
                    >
                      Edit
                    </Link>
                    {" | "}
                    <span
                      className="delete-link"
                      onClick={() => handleDelete(task.id)}
                    >
                      Delete
                    </span>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TasksList;
