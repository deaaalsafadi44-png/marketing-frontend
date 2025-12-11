import React, { useEffect, useState } from "react";
import { getUsers, deleteUserApi } from "../../services/usersService";
import { Link, useNavigate } from "react-router-dom";
import "./users.css";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // ==========================
  // Load Users
  // ==========================
  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error("Error loading users:", err);

      // ❌ Forbidden (ليس أدمن)
      if (err?.response?.status === 403) {
        alert("❌ Only Admin can view users list");
        navigate("/");
        return;
      }

      // ❌ أخطاء أخرى
      alert("Failed to load users. Try again later.");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ==========================
  // Delete User
  // ==========================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUserApi(id);
      loadUsers();
    } catch (err) {
      console.error("Delete user error:", err);

      // ❌ ممنوع لغير الأدمن
      if (err?.response?.status === 403) {
        alert("❌ Only Admin can delete users!");
        return;
      }

      alert("Failed to delete user. Try again.");
    }
  };

  return (
    <div className="users-container">
      <h1 className="users-title">Users List ({users.length})</h1>

      <Link to="/users/add" className="add-user-btn">
        + Add New User
      </Link>

      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.dept}</td>
              <td>{user.createdAt}</td>

              <td>
                <Link to={`/users/edit/${user.id}`} className="edit-link">
                  Edit
                </Link>{" "}
                |{" "}
                <span
                  className="delete-link"
                  onClick={() => handleDelete(user.id)}
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

export default UsersList;
