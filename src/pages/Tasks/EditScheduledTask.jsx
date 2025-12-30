import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// استدعاء الدوال الأصلية من ملف الخدمة الخاص بك
import { getTaskById, updateScheduledTaskApi, getOptions } from "../../services/tasksService";

const EditScheduledTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]); // لتخزين قائمة الموظفين
  const [formData, setFormData] = useState({
    title: "",
    frequency: "",
    startDate: "",
    executionTime: "09:00", // وقت افتراضي
    assignedTo: "" // المعرف الخاص بالموظف
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. جلب بيانات المهمة المجدولة
        const taskRes = await getTaskById(id);
        const task = taskRes.data;

        // 2. جلب قائمة الموظفين من الإعدادات/الخيارات
        const optionsRes = await getOptions();
        setWorkers(optionsRes.data.workers || []);

        // تعبئة النموذج بالبيانات المسترجعة
        setFormData({
          title: task.title || "",
          frequency: task.frequency || "daily",
          assignedTo: task.assignedTo || "",
          // فصل التاريخ عن الوقت إذا كانا مخزنين معاً
          startDate: task.nextRun ? new Date(task.nextRun).toISOString().split('T')[0] : "",
          executionTime: task.executionTime || "09:00"
        });
      } catch (err) {
        console.error("Error fetching data", err);
        alert("Could not load data.");
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
      alert("Schedule updated successfully! ✅");
      navigate("/tasks/scheduled");
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update schedule. ❌");
    }
  };

  if (loading) return <div style={{ padding: "50px", textAlign: "center" }}>Loading...</div>;

  return (
    <div style={{ padding: "30px", maxWidth: "500px", margin: "40px auto", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
      <h2 style={{ color: "#673ab7", marginBottom: "20px", textAlign: "center", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>
        📝 Edit Schedule
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        
        {/* العنوان */}
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Task Title</label>
          <input 
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
            type="text" 
            value={formData.title} 
            onChange={(e) => setFormData({...formData, title: e.target.value})} 
            required 
          />
        </div>

        {/* الموظف المسؤول */}
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Assign To (الموظف)</label>
          <select 
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", backgroundColor: "white" }}
            value={formData.assignedTo} 
            onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
            required
          >
            <option value="">Select Worker...</option>
            {workers.map(worker => (
              <option key={worker._id} value={worker._id}>{worker.name}</option>
            ))}
          </select>
        </div>

        {/* التكرار */}
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Frequency</label>
          <select 
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", backgroundColor: "white" }}
            value={formData.frequency} 
            onChange={(e) => setFormData({...formData, frequency: e.target.value})}
          >
            <option value="daily">Daily (يومي)</option>
            <option value="weekly">Weekly (أسبوعي)</option>
            <option value="monthly">Monthly (شهري)</option>
          </select>
        </div>

        {/* تاريخ التنفيذ القادم */}
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Next Date</label>
          <input 
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
            type="date" 
            value={formData.startDate} 
            onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
            required 
          />
        </div>

        {/* وقت التنفيذ */}
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Execution Time (الساعة)</label>
          <input 
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
            type="time" 
            value={formData.executionTime} 
            onChange={(e) => setFormData({...formData, executionTime: e.target.value})} 
            required 
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <button type="submit" style={{ flex: 1, backgroundColor: "#4caf50", color: "white", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            Save Changes
          </button>
          <button type="button" onClick={() => navigate("/tasks/scheduled")} style={{ flex: 1, backgroundColor: "#f44336", color: "white", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditScheduledTask;