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

  // ===============================
  // Load Users (Protected)
  // ===============================
  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error("Error loading users:", err);

      // ❌ التوكن انتهى
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      // ❌ لا يوجد صلاحية
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

  // ===============================
  // Filters
  // ===============================
  const filtered = users.filter((u) => {
    return (
      (deptFilter === "" || u.dept === deptFilter) &&
      u.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  // ===============================
  // Delete User
  // ===============================
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
    return <h2 style={{ textAlign: "center", marginTop: "30px" }}>Loading...</h2>;
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>Users Management</h1>
        <Link to="/users/add" className="add-user-btn">
          + Add User
        </Link>
      </div>

      {/* Filters */}
      <div className="users-filters">
        <input
          type="text"
          placeholder="Search by name..."
          onChange={(e) => setSearch(e.target.value)}
        />

        <select onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="">Department</option>
          <option>Design</option>
          <option>Content</option>
          <option>Marketing</option>
          <option>Finance</option>
          <option>Video</option>
        </select>
      </div>

      {/* Users Table */}
      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.dept}</td>
              <td>
                <Link to={`/users/edit/${u.id}`} className="edit-link">
                  Edit
                </Link>{" "}
                |{" "}
                <span
                  className="delete-link"
onClick={() => handleDelete(u._id)}
                >
                  Delete
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
