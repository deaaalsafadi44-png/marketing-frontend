import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// استيراد نفس الخدمات المستخدمة في صفحة الـ Add
import { getTaskById, updateScheduledTaskApi, getOptions } from "../../services/tasksService";
import { getUsers } from "../../services/usersService";

const EditScheduledTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 1. حالات تخزين البيانات (Options) بنفس هيكل صفحة الـ Add
  const [options, setOptions] = useState({
    priority: [],
    status: [],
    companies: [],
  });
  const [users, setUsers] = useState([]); // قائمة الموظفين المنفصلة

  // 2. حالة النموذج (Form State)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company: "",
    workerId: "", // نستخدم workerId للتوافق مع الباك إند
    priority: "",
    status: "",
    type: "",
    frequency: "daily",
    startDate: "",
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // جلب جميع البيانات بالتوازي كما في صفحة الـ Add
        const [taskRes, opsRes, usersRes] = await Promise.all([
          getTaskById(id),
          getOptions(),
          getUsers()
        ]);

        // ضبط الخيارات (شركات، أولويات، حالات)
        setOptions({
          priority: opsRes.data.priority || [],
          status: opsRes.data.status || [],
          companies: opsRes.data.companies || [],
        });

        // ضبط قائمة المستخدمين (حل مشكلة القائمة الفارغة)
        setUsers(usersRes.data || []);

        // ملء بيانات المهمة الحالية في النموذج
        if (taskRes.data) {
          const task = taskRes.data;
          setFormData({
            title: task.title || "",
            description: task.description || "",
            company: task.company || "",
            workerId: task.workerId || "",
            priority: task.priority || "",
            status: task.status || "",
            type: task.type || "",
            frequency: task.frequency || "daily",
            // تحويل التاريخ لصيغة datetime-local المطلوبة (YYYY-MM-DDTHH:mm)
            startDate: task.nextRun ? new Date(task.nextRun).toISOString().slice(0, 16) : "",
          });
        }
      } catch (err) {
        console.error("Error loading edit data:", err);
        alert("❌ فشل في تحميل بيانات التعديل");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  /* ================= HANDLERS (مأخوذة من Add.jsx) ================= */
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkerChange = (e) => {
    const selectedWorkerId = e.target.value;
    const selectedUser = users.find((u) => String(u.id) === String(selectedWorkerId));

    setFormData((prev) => ({
      ...prev,
      workerId: selectedWorkerId,
      type: selectedUser ? (selectedUser.dept || "General") : "", 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // معالجة التاريخ قبل الإرسال كما في Add.jsx
      const finalData = {
        ...formData,
        nextRun: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null
      };

      await updateScheduledTaskApi(id, finalData);
      alert("✅ Task Updated Successfully!");
      navigate("/tasks/scheduled");
    } catch (err) {
      console.error("Update error:", err);
      alert("❌ Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Loading Data...</div>;

  return (
    <div style={{ backgroundColor: "#f4f7f6", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "15px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", padding: "30px" }}>
        
        <h2 style={{ color: "#673ab7", textAlign: "center", marginBottom: "30px" }}>📝 Edit Scheduled Task</h2>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Task Title</label>
            <input 
              name="title"
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}
              type="text" value={formData.title} onChange={handleChange} required 
            />
          </div>

          {/* Company & Worker (الجزء الذي كان فارغاً) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Company</label>
              <select name="company" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}
                value={formData.company} onChange={handleChange} required>
                <option value="">Select Company</option>
                {options.companies.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Assigned User</label>
              <select name="workerId" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}
                value={formData.workerId} onChange={handleWorkerChange} required>
                <option value="">Select User</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} — ({u.dept || "No Job Title"})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Task Type (Auto-filled) */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Task Type (Auto-filled)</label>
            <input 
              type="text" 
              value={formData.type} 
              readOnly 
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", backgroundColor: "#f0f0f0" }} 
            />
          </div>

          {/* Frequency & Start Date */}
          <div style={{ border: "2px dashed #673ab744", borderRadius: "12px", padding: "20px", backgroundColor: "#f9f9ff", marginBottom: "30px" }}>
            <h4 style={{ margin: "0 0 15px 0", color: "#673ab7" }}>🕒 Scheduling Settings</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "bold" }}>Frequency</label>
                <select name="frequency" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
                  value={formData.frequency} onChange={handleChange}>
                  <option value="daily">Repeat Daily</option>
                  <option value="weekly">Repeat Weekly</option>
                  <option value="monthly">Repeat Monthly</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "bold" }}>Start Date & Time</label>
                <input type="datetime-local" name="startDate" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
                  value={formData.startDate} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "15px" }}>
            <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: "15px", backgroundColor: "#3f51b5", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
               {isSubmitting ? "Updating..." : "Update Task"}
            </button>
            <button type="button" onClick={() => navigate("/tasks/scheduled")} style={{ flex: 1, padding: "15px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
               Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditScheduledTask;