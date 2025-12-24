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

/* =============================================
    🛠️ دالة جلب الشعار (تعريفها قبل المكون)
   ============================================= */
const getCompanyLogo = (companyName) => {
  const name = companyName?.toLowerCase().trim();
  // تأكد أن هذه الملفات موجودة في مجلد public مباشرة
  if (name === "laffah") return "/laffah.png"; 
  if (name === "syrian united co") return "/logos/syrian_united.png";
  if (name === "healthy family") return "/logos/healthy_family.png";
  
  // شعار افتراضي في حال لم يتطابق الاسم
  return "/laffah.png"; 
};

const TasksList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusOptions, setStatusOptions] = useState([]);

  const safeLower = (val) => String(val || "").toLowerCase();
  const safeDate = (val) => {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase().trim();
    switch (s) {
      case "new": return "#2196f3";
      case "accepted": case "accebted": return "#9c27b0";
      case "in progress": return "#fbc02d";
      case "under review": return "#ff9800";
      case "approved": return "#4caf50";
      default: return "#555";
    }
  };

  const normalizeClass = (text) =>
    safeLower(text).replace(/\s+/g, "-") || "default";

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadTasks = async () => {
    try {
      const res = await getTasks();
      setTasks(res.data || []);
      const opt = await getOptions();
      setStatusOptions(opt.data?.status || []);
    } catch (err) {
      if (err?.response?.status === 403) {
        navigate("/unauthorized", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) loadTasks();
    if (location.state?.refresh) {
      navigate("/tasks", { replace: true, state: {} });
    }
  }, [authLoading, user, location.state]);

  const handleStatusChange = async (taskId, newStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      await updateTaskApi(taskId, { ...task, status: newStatus });
      loadTasks();
    } catch (err) {
      console.error("Update failed", err);
      alert("You don't have permission to update this task status.");
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    await deleteTaskApi(taskId);
    loadTasks();
  };

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

  if (authLoading || loading) return <h2 style={{textAlign:'center', marginTop:'50px'}}>Loading...</h2>;
  if (!user) return null;

  return (
    <div className="tasks-container">
      <h1 className="tasks-title">
        Tasks List ({filteredTasks.length} Total)
      </h1>

      <div className="filters-row">
        <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
          <option value="">All Companies</option>
          {[...new Set(tasks.map((t) => t.company).filter(Boolean))].map(
            (company, i) => (
              <option key={i} value={company}>{company}</option>
            )
          )}
        </select>

        <input type="date" onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" onChange={(e) => setDateTo(e.target.value)} />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {statusOptions.map((s, i) => (
            <option key={i} value={s}>{s}</option>
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
          {filteredTasks.map((task) => {
            const canChangeStatus = 
              user.role === "Admin" || 
              user.role === "Manager" || 
              task.workerName === user.username;

            return (
              <tr key={task.id}>
                <td>{task.id}</td>
                
                {/* ✅ عرض الشركة مع اللوغو الدائري الصغير */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        border: '1px solid #ddd',
                        overflow: 'hidden',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        flexShrink: 0
                    }}>
                        <img 
                          src={getCompanyLogo(task.company)} 
                          alt="logo" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                    </div>
                    <span style={{fontWeight:'500'}}>{task.company}</span>
                  </div>
                </td>

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
                    disabled={!canChangeStatus}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    style={{
                      backgroundColor: getStatusColor(task.status),
                      color: "#fff",
                      padding: '5px 10px',
                      borderRadius: '5px',
                      border: 'none',
                      cursor: canChangeStatus ? "pointer" : "not-allowed",
                    }}
                  >
                    {statusOptions.map((s, i) => (
                      <option key={i} value={s} style={{backgroundColor:'#fff', color:'#000'}}>{s}</option>
                    ))}
                  </select>
                </td>

                <td>
                  <Link to={`/tasks/view/${task.id}`} className="view-link">View</Link>
                  {(user.role === "Admin" || user.role === "Manager") && (
                    <>
                      {" | "}
                      <Link to={`/tasks/edit/${task.id}`} className="edit-link">Edit</Link>
                      {" | "}
                      <span className="delete-link" onClick={() => handleDelete(task.id)}>Delete</span>
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