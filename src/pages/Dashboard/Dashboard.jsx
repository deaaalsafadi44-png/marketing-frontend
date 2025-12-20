import "./dashboard.css";
import StatCard from "../../components/StatCard";
import { Pie, Bar } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { getTasks } from "../../services/tasksService";
import { useNavigate } from "react-router-dom";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getTasks();
        setTasks(res.data);
      } catch (err) {
        console.error("Error loading tasks:", err);

        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      }
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return <h2 style={{ textAlign: "center", marginTop: "40px" }}>Loading...</h2>;
  }

  /* =====================
     STATISTICS
  ===================== */
  const total = tasks.length;

  const inProgress = tasks.filter(
    (t) => t.status === "In Progress" || t.status === "Accepted"
  ).length;

  const done = tasks.filter((t) => t.status === "Approved").length;

  const pending = tasks.filter(
    (t) =>
      t.status === "Pending" ||
      t.status === "New" ||
      t.status === "Under Review"
  ).length;

  /* =====================
     COMPANY COUNTS
  ===================== */
  const companyCounts = {};
  tasks.forEach((t) => {
    companyCounts[t.company] = (companyCounts[t.company] || 0) + 1;
  });

  /* =====================
     TYPE COUNTS
  ===================== */
  const typeCounts = {};
  tasks.forEach((t) => {
    typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
  });

  /* =====================
     PIE DATA
  ===================== */
  const pieData = {
    labels: Object.keys(companyCounts),
    datasets: [
      {
        label: "Tasks",
        data: Object.values(companyCounts),
        backgroundColor: ["#1976d2", "#26a69a", "#ffca28", "#ef5350", "#8e24aa"],
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 12,
        },
      },
    },
  };

  /* =====================
     BAR DATA
  ===================== */
  const barData = {
    labels: Object.keys(typeCounts),
    datasets: [
      {
        label: "عدد المهام",
        data: Object.values(typeCounts),
        backgroundColor: "#4caf50",
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">لوحة القيادة الرئيسية (Dashboard)</h1>

      {/* Stats */}
      <div className="stats-row">
        <StatCard title="Total Tasks" value={total} border="black" />
        <StatCard title="In Progress" value={inProgress} border="gold" />
        <StatCard title="Completed" value={done} border="green" />
        <StatCard title="Pending / New" value={pending} border="red" />
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="chart-box">
          <h3 className="chart-title">توزيع المهام حسب الشركة</h3>
          <div className="chart-content">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        <div className="chart-box">
          <h3 className="chart-title">إحصائيات المهام حسب النوع</h3>
          <div className="chart-content">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
