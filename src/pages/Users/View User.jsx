import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserById } from "../../services/usersService";
import "./users.css";

const ViewUser = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // جلب البيانات من API
  useEffect(() => {
    getUserById(id)
      .then((res) => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, [id]);

  // حالة التحميل
  if (loading) return <h2>Loading...</h2>;

  // في حالة عدم العثور على المستخدم
  if (!user) return <h2>User Not Found</h2>;

  return (
    <div className="view-user-page">
      <h1>User Details</h1>

      <div className="user-card">
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Created At:</strong> {user.createdAt}</p>
      </div>

      <Link to={`/users/edit/${user.id}`} className="edit-btn">
        Edit User
      </Link>

      <br /><br />

      <Link to="/users" className="back-btn">
        ← Back to Users List
      </Link>
    </div>
  );
};

export default ViewUser;
