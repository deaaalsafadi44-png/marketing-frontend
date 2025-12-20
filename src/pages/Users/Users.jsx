import "./users.css";
import { useEffect, useState } from "react";
import { getUsers, deleteUserApi } from "../../services/usersService";
import { Link, useNavigate } from "react-router-dom";

const Users = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  /* ===============================
     Load Users (Protected)
  =============================== */
  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error("Error loading users:", err);

      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (err?.response?.status === 403) {
        alert("❌ Only Admin can access users list!");
        navigate("/");
        return;
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /* ===============================
     Filters
  =============================== */
  const filtered = users.filter((u) => {
    return (
      (deptFilter === "" || u.dept === deptFilter) &&
      u.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  /* ===============================
     Delete User
  =============================== */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUserApi(id);
      loadUsers();
    } catch (err) {
      console.error("Delete user error:", err);

      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (err?.response?.status === 403) {
        alert("❌ Only Admin can delete users!");
        return;
      }

      alert("❌ Failed to delete user. Try again.");
    }
  };

  if (loading) {
    return (
      <div className="users-loading">
        Loading users...
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-card">

        {/* ===== Header ===== */}
        <div className="users-header">
          <div>
            <h1 className="users-title">Users Management</h1>
            <p className="users-subtitle">
              Manage system users, roles and departments
            </p>
          </div>

          <Link to="/users/add" className="add-user-btn">
            + Add User
          </Link>
        </div>

        {/* ===== Filters Toolbar ===== */}
        <div className="users-toolbar">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            <option>Design</option>
            <option>Content</option>
            <option>Marketing</option>
            <option>Finance</option>
            <option>Video</option>
          </select>
        </div>

        {/* ===== Table ===== */}
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>

                    <td className="user-name">
                      {u.name}
                    </td>

                    <td>{u.email}</td>

                    <td>
                      <span className={`role-badge role-${u.role.toLowerCase()}`}>
                        {u.role}
                      </span>
                    </td>

                    <td>
                      <span className="dept-badge">
                        {u.dept}
                      </span>
                    </td>

                    <td className="actions-cell">
                      <Link
                        to={`/users/edit/${u.id}`}
                        className="action-edit"
                      >
                        Edit
                      </Link>

                      <button
                        className="action-delete"
                        onClick={() => handleDelete(u.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Users;
