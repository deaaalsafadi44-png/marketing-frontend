import React, { useEffect, useState } from "react";
import { getScheduledTemplatesApi, deleteTaskApi } from "../../services/tasksService";
import { Link } from "react-router-dom";
import "./scheduled.css"; // سننشئ ملف التنسيق لاحقاً

const ScheduledTasks = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await getScheduledTemplatesApi();
      setTemplates(res.data);
    } catch (err) {
      console.error("Error loading templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to stop this schedule?")) {
      try {
        await deleteTaskApi(id);
        setTemplates(templates.filter(t => t.id !== id));
      } catch (err) {
        alert("Failed to delete template");
      }
    }
  };

  if (loading) return <div className="loader">Loading Schedules...</div>;

  return (
    <div className="page-content">
      <div className="header-flex">
        <h2>📅 Scheduled Task Templates</h2>
<Link to="/tasks/add" state={{ fromScheduled: true }} className="add-btn">+ Create New Schedule</Link>
      </div>

      <div className="scheduled-grid">
        {templates.length === 0 ? (
          <p>No scheduled tasks found.</p>
        ) : (
          templates.map((temp) => (
            <div key={temp.id} className="schedule-card">
              <h3>{temp.title}</h3>
              <p><strong>Frequency:</strong> {temp.frequency}</p>
              <p><strong>Assigned to:</strong> {temp.workerName}</p>
              <p><strong>Next Run:</strong> {new Date(temp.nextRun).toLocaleDateString()}</p>
              <div className="card-actions">
                <button onClick={() => handleDelete(temp.id)} className="delete-btn">Stop Schedule</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ScheduledTasks;