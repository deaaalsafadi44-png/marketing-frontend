import React, { useEffect, useState } from "react";
import { getTaskById } from "../../services/tasksService";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../services/apiClient";
import "./view.css";

const ViewTask = () => {
  const { id } = useParams(); // task numeric id
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  /* ================= LOAD TASK ================= */

  useEffect(() => {
    // 🛡️ تحقق قوي من الـ ID
    if (!id || isNaN(Number(id))) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const loadTask = async () => {
      try {
        const res = await getTaskById(id);

        if (!res?.data) {
          setNotFound(true);
        } else {
          setTask(res.data);
        }
      } catch (err) {
        console.error("Error loading task:", err);

        if (err?.response?.status === 403) {
          alert("❌ غير مسموح لك بعرض هذه المهمة");
          navigate("/tasks");
          return;
        }

        setNotFound(true);
      }

      setLoading(false);
    };

    loadTask();
  }, [id, navigate]);

  /* ================= TIMER ================= */

  useEffect(() => {
    if (!id || isNaN(Number(id))) return;

    const savedStart = localStorage.getItem("timer_start_" + id);
    const savedSeconds = localStorage.getItem("timer_seconds_" + id);

    if (savedSeconds) setSeconds(Number(savedSeconds));

    if (savedStart) {
      const startTime = Number(savedStart);
      const diff = Math.floor((Date.now() - startTime) / 1000);
      setSeconds((prev) => prev + diff);
      setIsRunning(true);
    }
  }, [id]);

  useEffect(() => {
    let interval = null;

    if (isRunning && id && !isNaN(Number(id))) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const updated = prev + 1;
          localStorage.setItem("timer_seconds_" + id, updated);
          return updated;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, id]);

  const startTimer = () => {
    if (!id || isNaN(Number(id))) return;
    localStorage.setItem("timer_start_" + id, Date.now());
    setIsRunning(true);
  };

  const pauseTimer = () => {
    if (!id || isNaN(Number(id))) return;
    localStorage.removeItem("timer_start_" + id);
    setIsRunning(false);
  };

  const finishTask = async () => {
    if (!id || isNaN(Number(id))) return;

    pauseTimer();
    const totalMinutes = Math.floor(seconds / 60);

    try {
      await api.put(`/tasks/${id}/time`, {
        timeSpent: totalMinutes,
      });

      alert("✅ Task finished! Time saved: " + totalMinutes + " min");

      setSeconds(0);
      setIsRunning(false);
      localStorage.removeItem("timer_start_" + id);
      localStorage.removeItem("timer_seconds_" + id);
    } catch (err) {
      alert("❌ Error saving time");
      console.error(err);
    }
  };

  /* ================= HELPERS ================= */

  const formatTime = () => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatStoredTime = (minutes) => {
    if (!minutes || minutes === 0) return "0m";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  /* ================= RENDER ================= */

  if (loading) return <div className="loading">Loading...</div>;
  if (notFound)
    return <h2 style={{ textAlign: "center" }}>❌ Task Not Found</h2>;

  return (
    <div className="view-wrapper">
      <div className="view-card">
        <h1 className="task-title">{task?.title || "—"}</h1>

        <div className="meta-section">
          <span className="badge badge-priority">
            {task?.priority || "—"}
          </span>
          <span className="badge badge-status">
            {task?.status || "—"}
          </span>
        </div>

        <div className="timer-box">
          <div className="timer-time">{formatTime()}</div>

          {!isRunning ? (
            <button className="timer-btn start" onClick={startTimer}>
              ▶ Start
            </button>
          ) : (
            <button className="timer-btn pause" onClick={pauseTimer}>
              ⏸ Pause
            </button>
          )}

          <button className="timer-btn finish" onClick={finishTask}>
            ✔ Finish
          </button>
        </div>

        <div className="info-grid">
          <div>
            <h3>Company</h3>
            <p>{task?.company || "—"}</p>
          </div>

          <div>
            <h3>Task Type</h3>
            <p>{task?.type || "—"}</p>
          </div>

          <div>
            <h3>Assigned To</h3>
            <p>{task?.workerName || "—"}</p>
          </div>

          <div>
            <h3>Created At</h3>
            <p>
              {task?.createdAt
                ? new Date(task.createdAt).toLocaleString()
                : "—"}
            </p>
          </div>

          <div>
            <h3>Time Spent</h3>
            <p>{formatStoredTime(task?.timeSpent)}</p>
          </div>
        </div>

        <div className="desc-section">
          <h2>Description</h2>
          <div
            className="desc-box"
            dangerouslySetInnerHTML={{
              __html: task?.description || "<i>No description</i>",
            }}
          />
        </div>

        <div className="actions-row">
          <Link to={`/tasks/edit/${id}`} className="btn-edit">
            ✏ Edit Task
          </Link>
          <Link to="/tasks" className="btn-back">
            ← Back to Tasks
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ViewTask;
