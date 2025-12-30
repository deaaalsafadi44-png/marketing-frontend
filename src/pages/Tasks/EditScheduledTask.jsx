import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// تأكدنا من مطابقة المسميات مع ملف tasksService.js الخاص بك
import { getTaskById, updateScheduledTaskApi, getOptions } from "../../services/tasksService";

const EditScheduledTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 🛡️ حماية 1: تهيئة الخيارات بمصفوفات فارغة لضمان عدم حدوث خطأ .map قبل التحميل
  const [options, setOptions] = useState({ 
    companies: [], 
    workers: [], 
    priorities: ["Low", "Medium", "High", "Urgent"] 
  });
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company: "",
    assignedTo: "",
    priority: "Medium",
    status: "Pending",
    frequency: "daily",
    startDate: "",
    executionTime: "09:00"
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب البيانات بالتوازي لسرعة الأداء
        const [taskRes, optionsRes] = await Promise.all([
          getTaskById(id),
          getOptions()
        ]);

        // 🛡️ حماية 2: تحديث الخيارات فقط إذا كانت البيانات موجودة فعلاً
        if (optionsRes && optionsRes.data) {
          setOptions({
            companies: optionsRes.data.companies || [],
            workers: optionsRes.data.workers || [],
            priorities: optionsRes.data.priorities || ["Low", "Medium", "High", "Urgent"]
          });
        }

        if (taskRes && taskRes.data) {
          const task = taskRes.data;
          setFormData({
            title: task.title || "",
            description: task.description || "",
            company: task.company || "",
            // ضمان الربط الصحيح للموظف
            assignedTo: task.workerId || task.assignedTo || "",
            priority: task.priority || "Medium",
            status: task.status || "Pending",
            frequency: task.frequency || "daily",
            // تحويل التاريخ لتنسيق input date (YYYY-MM-DD)
            startDate: task.nextRun ? new Date(task.nextRun).toISOString().split('T')[0] : "",
            executionTime: task.executionTime || "09:00"
          });
        }
      } catch (err) {
        console.error("Error loading task data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateScheduledTaskApi(id, formData);
      alert("Task Updated Successfully! ✅");
      navigate("/tasks/scheduled");
    } catch (err) {
      alert("Update Failed! ❌");
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '50px', fontSize: '18px'}}>Loading Task Details...</div>;

  return (
    <div style={{ backgroundColor: "#f4f7f6", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "15px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        
        <div style={{ padding: "20px", borderBottom: "1px solid #eee", textAlign: "center" }}>
          <h2 style={{ color: "#673ab7", margin: 0 }}>📝 Edit Scheduled Task</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "30px" }}>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Task Title</label>
            <input 
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}
              type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required 
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Description</label>
            <textarea 
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", minHeight: "100px" }}
              value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Company</label>
              <select style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}
                value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})}>
                <option value="">Select Company</option>
                {/* 🛡️ حماية 3: Optional chaining (?.) لمنع انهيار الصفحة (الصورة 1179) */}
                {options.companies?.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Assigned User</label>
              <select style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}
                value={formData.assignedTo} onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}>
                <option value="">Select User</option>
                {options.workers?.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Priority</label>
              <select style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}
                value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                {options.priorities?.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Status</label>
              <select style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}
                value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div style={{ border: "2px dashed #673ab744", borderRadius: "12px", padding: "20px", backgroundColor: "#f9f9ff" }}>
            <h4 style={{ margin: "0 0 15px 0", color: "#673ab7", display: "flex", alignItems: "center", gap: "10px" }}>
              🕒 Task Scheduling
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Frequency</label>
                <select style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
                  value={formData.frequency} onChange={(e) => setFormData({...formData, frequency: e.target.value})}>
                  <option value="daily">Repeat Daily</option>
                  <option value="weekly">Repeat Weekly</option>
                  <option value="monthly">Repeat Monthly</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Start Date & Time</label>
                <div style={{ display: "flex", gap: "5px" }}>
                  <input type="date" style={{ flex: 2, padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
                    value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                  <input type="time" style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
                    value={formData.executionTime} onChange={(e) => setFormData({...formData, executionTime: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "30px", display: "flex", gap: "15px" }}>
            {/* تم تصحيح كلمة white هنا */}
            <button type="submit" style={{ flex: 1, padding: "15px", backgroundColor: "#3f51b5", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "16px" }}>
               Update Task
            </button>
            <button type="button" onClick={() => navigate("/tasks/scheduled")} style={{ flex: 1, padding: "15px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "16px" }}>
               Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditScheduledTask;