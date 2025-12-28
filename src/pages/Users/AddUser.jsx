import { useState, useEffect } from "react"; // أضفنا useEffect
import { addUserApi } from "../../services/usersService";
import { getAllOptions } from "../../services/optionsService";
import { useNavigate } from "react-router-dom";
import "./addUser.css"; // 🔥 ملف تنسيقات جديد

const AddUser = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");

  // 1. حالة لتخزين الأقسام القادمة من السيرفر
  const [departments, setDepartments] = useState([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Employee",
    dept: "", // جعلناها فارغة لتبدأ بأول قيمة من السيرفر
  });

  // 2. جلب الأقسام من السيرفر بمجرد تحميل الصفحة
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await getAllOptions();
        const titles = data.jobTitles || [];
        setDepartments(titles);
        
        // تعيين أول قسم كخيار افتراضي إذا كانت القائمة ليست فارغة
        if (titles.length > 0) {
          setForm(prev => ({ ...prev, dept: titles[0] }));
        }
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };
    fetchDocs();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError(""); // حذف الأخطاء عند الكتابة
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ❌ تحقق من تطابق كلمة المرور
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      await addUserApi(form);

      alert("User added successfully!");
      navigate("/users");
    } catch (err) {
      console.error("Add user error:", err);

      if (err?.response?.status === 403) {
        alert("❌ Only Admin can add new users!");
        navigate("/users");
        return;
      }

      if (err?.response?.status === 400) {
        setError("Email already exists!");
        setLoading(false);
        return;
      }

      setError("Failed to add user. Try again.");
    }

    setLoading(false);
  };

  return (
    <div className="full-bg">
      <div className="add-user-wrapper">
        <div className="add-user-card">

          <h2 className="title">Add New User</h2>

          <form className="add-user-form" onSubmit={handleSubmit}>
            {error && <div className="error-box">{error}</div>}

            {/* Name */}
            <label>Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
            />

            {/* Email */}
            <label>Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
            />

            {/* Password */}
            <label>Password</label>
            <div className="password-box">
              <input
                type={showPass ? "text" : "password"}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
              />
              <span
                className="eye-icon"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? "👁️‍🗨️" : "👁️"}
              </span>
            </div>

            {/* Confirm Password */}
            <label>Confirm Password</label>
            <div className="password-box">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                required
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

            {/* Role */}
            <label>Role</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
            </select>

            {/* Department - 🔥 أصبحت ديناميكية تسحب من السيرفر الآن */}
            <label>Department</label>
            <select name="dept" value={form.dept} onChange={handleChange}>
              {departments.length > 0 ? (
                departments.map((d, index) => (
                  <option key={index} value={d}>
                    {d}
                  </option>
                ))
              ) : (
                <option value="">Loading departments...</option>
              )}
            </select>

            <button
              type="submit"
              className={`btn-save ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              <span className="btn-content">
                {loading ? "Saving..." : "Add User"}
              </span>
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUser;