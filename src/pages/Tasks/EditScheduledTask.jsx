import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// ✅ تعديل هنا: استدعاء getTaskById بدلاً من getTaskByIdApi
import { getTaskById, updateScheduledTaskApi } from "../../services/tasksService";

const EditScheduledTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    frequency: "",
    startDate: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        // ✅ تعديل هنا: استخدام getTaskById
        const res = await getTaskById(id);
        const task = res.data;
        
        setFormData({
          title: task.title || "",
          frequency: task.frequency || "daily",
          startDate: task.nextRun ? new Date(task.nextRun).toISOString().split('T')[0] : ""
        });
      } catch (err) {
        console.error("Error fetching task", err);
        alert("Could not load task data.");
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
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

  if (loading) return <div style={{ padding: "50px", textAlign: "center" }}>Loading Template Data...</div>;

  return (
    <div style={{ padding: "30px", maxWidth: "500px", margin: "40px auto", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
      <h2 style={{ color: "#673ab7", marginBottom: "20px", textAlign: "center", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>
        📝 Edit Schedule
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Task Title</label>
          <input 
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px" }}
            type="text" 
            value={formData.title} 
            onChange={(e) => setFormData({...formData, title: e.target.value})} 
            required 
          />
        </div>

        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Frequency</label>
          <select 
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", backgroundColor: "white" }}
            value={formData.frequency} 
            onChange={(e) => setFormData({...formData, frequency: e.target.value})}
          >
            <option value="daily">Daily (يومي)</option>
            <option value="weekly">Weekly (أسبوعي)</option>
            <option value="monthly">Monthly (شهري)</option>
          </select>
        </div>

        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Next Execution Date</label>
          <input 
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px" }}
            type="date" 
            value={formData.startDate} 
            onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
            required 
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
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