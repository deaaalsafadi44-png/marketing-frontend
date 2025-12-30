import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// التأكد من استيراد الدوال الصحيحة من ملف الخدمات
import { getTaskById, updateScheduledTaskApi, getOptions } from "../../services/tasksService";

const EditScheduledTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 🛡️ الحل لمنع خطأ الـ Map: تهيئة الخيارات بمصفوفات فارغة
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
        setLoading(true);
        // جلب بيانات المهمة والخيارات (الموظفين والشركات)
        const [taskRes, optionsRes] = await Promise.all([
          getTaskById(id),
          getOptions()
        ]);

        // ربط الخيارات بالقوائم المنسدلة لضمان ظهور الموظفين
        if (optionsRes?.data) {
          setOptions({
            companies: optionsRes.data.companies || [],
            workers: optionsRes.data.workers || [],
            priorities: optionsRes.data.priorities || ["Low", "Medium", "High", "Urgent"]
          });
        }

        // تعبئة النموذج ببيانات المهمة الحالية
        if (taskRes?.data) {
          const task = taskRes.data;
          setFormData({
            title: task.title || "",
            description: task.description || "",
            company: task.company || "",
            assignedTo: task.workerId || task.assignedTo || "",
            priority: task.priority || "Medium",
            status: task.status || "Pending",
            frequency: task.frequency || "daily",
            // تحويل التاريخ لتنسيق يفهمه المتصفح YYYY-MM-DD
            startDate: task.nextRun ? new Date(task.nextRun).toISOString().split('T')[0] : "",
            executionTime: task.executionTime || "09:00"
          });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // إرسال التحديثات للباك إند
      await updateScheduledTaskApi(id, formData);
      alert("تم تحديث الجدولة بنجاح! ✅");
      navigate("/tasks/scheduled");
    } catch (err) {
      alert("فشل تحديث الجدولة! ❌");
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>جاري جلب البيانات...</div>;

  return (
    <div style={{ backgroundColor: "#f4f7f6", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "15px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
        
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Company</label>
              <select style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}
                value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})}>
                <option value="">Select Company</option>
                {/* 🛡️ استخدام ?. يمنع انهيار الصفحة إذا كانت المصفوفة فارغة */}
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

          {/* قسم الجدولة المطابق للصورة 1178 */}
          <div style={{ border: "2px dashed #673ab744", borderRadius: "12px", padding: "20px", backgroundColor: "#f9f9ff" }}>
            <h4 style={{ margin: "0 0 15px 0", color: "#673ab7" }}>🕒 Task Scheduling</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <select style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
                value={formData.frequency} onChange={(e) => setFormData({...formData, frequency: e.target.value})}>
                <option value="daily">Repeat Daily</option>
                <option value="weekly">Repeat Weekly</option>
                <option value="monthly">Repeat Monthly</option>
              </select>
              <input type="date" style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
                value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
            </div>
          </div>

          <div style={{ marginTop: "30px", display: "flex", gap: "15px" }}>
            <button type="submit" style={{ flex: 1, padding: "15px", backgroundColor: "#3f51b5", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>
               Update Task
            </button>
            <button type="button" onClick={() => navigate("/tasks/scheduled")} style={{ flex: 1, padding: "15px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>
               Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditScheduledTask;