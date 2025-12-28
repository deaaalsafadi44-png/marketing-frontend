import { useEffect, useState } from "react";
import { getUserById, updateUserApi } from "../../services/usersService";
import { useNavigate, useParams } from "react-router-dom";
import { getAllOptions } from "../../services/optionsService";

const EditUser = () => {
  const { id } = useParams(); // Mongo _id
  const navigate = useNavigate();

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
const [departments, setDepartments] = useState([]); // مصفوفة فارغة في البداية
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
      // 1. جلب المسميات الوظيفية من السيرفر
      const optionsRes = await getAllOptions();
      const titles = optionsRes.jobTitles || [];
      setDepartments(titles);

      // 2. جلب بيانات المستخدم
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
        dept: res.data.dept || (titles.length > 0 ? titles[0] : ""), // إذا لم يوجد قسم نأخذ أول خيار متاح
      });
    } catch (err) {
      console.error(err);
      alert("Error loading data");
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
            {/* نقوم بعمل Loop على الأقسام القادمة من السيرفر */}
            {departments.length > 0 ? (
              departments.map((d, index) => (
                <option key={index} value={d}>
                  {d}
                </option>
              ))
            ) : (
              <option value="">No departments available</option>
            )}
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