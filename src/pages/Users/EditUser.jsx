import { useEffect, useState } from "react";
import { getUserById, updateUserApi } from "../../services/usersService";
import { useNavigate, useParams } from "react-router-dom";


const EditUser = () => {
  const { id } = useParams(); // Mongo _id
  const navigate = useNavigate();

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Employee",
    dept: "Design",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getUserById(id);

        if (!res?.data) {
          throw new Error("User not found");
        }

        setForm({
          name: res.data.name || "",
          email: res.data.email || "",
          password: "",
          confirmPassword: "",
          role: res.data.role || "Employee",
          dept: res.data.dept || "Design",
        });
      } catch (err) {
        console.error(err);
        alert("User not found");
        navigate("/users");
      }

      setLoading(false);
    };

    load();
  }, [id, navigate]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setSaving(true);

    const dataToSend = {
      name: form.name,
      email: form.email,
      role: form.role,
      dept: form.dept,
    };

    if (form.password) {
      dataToSend.password = form.password;
    }

    try {
      await updateUserApi(id, dataToSend);
      alert("User updated successfully!");
      navigate("/users");
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 400) {
        setError("Email already exists!");
      } else {
        setError("Update failed. Try again.");
      }
    }

    setSaving(false);
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div className="add-user-wrapper">
      <div className="add-user-card">
        <h2 className="title">Edit User</h2>

        <form className="add-user-form" onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}

          <label>Name</label>
          <input
            type="text"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
          />

          <label>Password (optional)</label>
          <div className="password-box">
            <input
              type={showPass ? "text" : "password"}
              name="password"
              placeholder="Leave blank to keep current password"
              value={form.password}
              onChange={handleChange}
            />
            <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
              {showPass ? "👁️‍🗨️" : "👁️"}
            </span>
          </div>

          <label>Confirm Password</label>
          <div className="password-box">
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            <span
              className="eye-icon"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? "👁️‍🗨️" : "👁️"}
            </span>
          </div>

          <label>Role</label>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Employee">Employee</option>
          </select>

          <label>Department</label>
          <select name="dept" value={form.dept} onChange={handleChange}>
            <option value="Design">Design</option>
            <option value="Content">Content</option>
            <option value="Marketing">Marketing</option>
            <option value="Video">Video</option>
            <option value="Finance">Finance</option>
          </select>

          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
