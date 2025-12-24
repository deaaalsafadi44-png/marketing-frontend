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

  // دالة مساعدة للمقارنة الآمنة بين النصوص بغض النظر عن حالة الأحرف (كبير/صغير)
  const isStatus = (status, target) => status?.trim().toLowerCase() === target.toLowerCase();

  const total = tasks.length;

  // 1. حساب قيد التنفيذ (In Progress / Accepted / Accebted)
  const inProgress = tasks.filter(
    (t) => 
      isStatus(t.status, "In Progress") || 
      isStatus(t.status, "Accepted") || 
      isStatus(t.status, "Accebted") // التعامل مع الخطأ الإملائي في الصور
  ).length;

  // 2. حساب المكتمل (Approved / Completed / Done)
  const done = tasks.filter(
    (t) => 
      isStatus(t.status, "Approved") || 
      isStatus(t.status, "Completed") ||
      isStatus(t.status, "Done")
  ).length;

  // 3. حساب المعلق والجديد (Pending / New / Under Review)
  const pending = tasks.filter(
    (t) =>
      isStatus(t.status, "Pending") ||
      isStatus(t.status, "New") ||
      isStatus(t.status, "Under Review")
  ).length;

  const companyCounts = {};
  tasks.forEach((t) => {
    companyCounts[t.company] = (companyCounts[t.company] || 0) + 1;
  });

  const typeCounts = {};
  tasks.forEach((t) => {
    typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
  });

  const pieData = {
    labels: Object.keys(companyCounts),
    datasets: [
      {
        label: "Tasks",
        data: Object.values(companyCounts),
        backgroundColor: ["#1976d2", "#26a69a", "#ffca28", "#ef5350", "#8e24aa"],
        borderWidth: 1,
        radius: 120,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
    layout: { padding: 10 },
  };

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
      legend: { position: "top" },
    },
    scales: {
      y: { beginAtZero: true },
      x: {
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          autoSkip: false,
          callback: function (value) {
            const label = this.getLabelForValue(value);
            return label.length > 10 ? label.slice(0, 10) + "…" : label;
          },
        },
      },
    },
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">لوحة القيادة الرئيسية (Dashboard)</h1>

      <div className="stats-row">
        <StatCard title="Total Tasks" value={total} border="black" />
        <StatCard title="In Progress" value={inProgress} border="gold" />
        <StatCard title="Completed" value={done} border="green" />
        <StatCard title="Pending / New" value={pending} border="red" />
      </div>

      <div className="charts-row">
        <div className="chart-box">
          <h3 className="chart-title">توزيع المهام حسب الشركة</h3>
          <div style={{ width: "100%", height: "350px" }}>
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        <div className="chart-box">
          <h3 className="chart-title">إحصائيات المهام حسب النوع</h3>
          <div style={{ width: "100%", height: "350px" }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;