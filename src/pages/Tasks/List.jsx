import { useEffect, useState } from "react";
import {
  getTasks,
  deleteTaskApi,
  updateTaskApi,
  getOptions,        // ⬅ تمت إضافته
} from "../../services/tasksService";
import "./tasks.css";
import { Link, useLocation, useNavigate } from "react-router-dom";

const TasksList = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⬅ الحالة الجديدة بدل المصفوفة الثابتة
  const [statusOptions, setStatusOptions] = useState([]);

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

  const normalizeStatusStrict = (value) => {
    if (!value) return "New";
    const clean = value.trim().toLowerCase();
    if (clean === "new") return "New";
    if (clean === "accepted") return "Accepted";
    if (clean === "in progress") return "In Progress";
    if (clean === "under review") return "Under Review";
    if (clean === "approved") return "Approved";
    return value;
  };

  const normalizeClass = (text) => {
    return text?.toLowerCase().replace(/\s+/g, "-") || "default";
  };

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadTasks = async () => {
    try {
      const res = await getTasks();
      setTasks(res.data);

      // ⬅ تحميل خيارات status من السيرفر
      const opt = await getOptions();
      setStatusOptions(opt.data.status || []);

    } catch (err) {
      console.error("Error loading tasks:", err);

      if (err?.response?.status === 403) {
        alert("❌ غير مصرح لك بعرض المهام");
        navigate("/");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();

    if (location.state?.refresh) {
      navigate("/tasks", { replace: true, state: {} });
    }
  }, [location.state]);

  const handleStatusChange = async (id, newStatus) => {
    const updatedStatus = newStatus;
    const task = tasks.find((t) => t.id === id);

    try {
      await updateTaskApi(id, { ...task, status: updatedStatus });
      loadTasks();
    } catch (err) {
      console.error("Status update error:", err);

      if (err?.response?.status === 403) {
        alert("❌ لا تملك صلاحية لتعديل حالة المهمة");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTaskApi(id);
      loadTasks();
    } catch (err) {
      console.error("Delete error:", err);

      if (err?.response?.status === 403) {
        alert("❌ فقط الأدمن يمكنه حذف المهام!");
      }
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const created = new Date(task.createdAt);

    return (
      (companyFilter === "" || task.company === companyFilter) &&
      (statusFilter === "" || task.status === statusFilter) &&
      task.type.toLowerCase().includes(search.toLowerCase()) &&
      (dateFrom === "" || created >= new Date(dateFrom)) &&
      (dateTo === "" || created <= new Date(dateTo + " 23:59:59"))
    );
  });

  if (loading) return <h2 style={{ textAlign: "center" }}>Loading...</h2>;

  return (
    <div className="tasks-container">
      <h1 className="tasks-title">
        Tasks List ({filteredTasks.length} Total)
      </h1>

      <div className="filters-row">
        <select onChange={(e) => setCompanyFilter(e.target.value)}>
          <option value="">Company</option>
          {[...new Set(tasks.map((t) => t.company))].map((company, i) => (
            <option key={i} value={company}>
              {company}
            </option>
          ))}
        </select>

        <input type="date" onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" onChange={(e) => setDateTo(e.target.value)} />

        {/* ⬅ الآن يجلب الـ Status من الإعدادات */}
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

        {user.role === "Admin" && (
          <Link to="/tasks/add" className="add-task-btn">
            + Add New Task
          </Link>
        )}
      </div>

      {/* TABLE */}
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
          {filteredTasks.map((task) => {
            return (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.company}</td>
                <td>{task.type}</td>
                <td>{task.workerName || "—"}</td>

                <td>
                  <span className={`tag tag-${normalizeClass(task.priority)}`}>
                    {task.priority}
                  </span>
                </td>

                <td>
                  <select
                    value={task.status}
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
                    </>
                  )}

                  {user.role === "Admin" && (
                    <>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TasksList;
