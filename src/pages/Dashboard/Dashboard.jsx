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

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getTasks();
        // تأكد من أننا نأخذ أحدث بيانات من السيرفر
        setTasks(res.data || []);
      } catch (err) {
        console.error("Error loading tasks:", err);
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  if (loading) {
    return <h2 style={{ textAlign: "center", marginTop: "40px" }}>Loading...</h2>;
  }

  /* =============================================
      📊 منطق الحساب الديناميكي (Dynamic Logic)
     ============================================= */
  
  const total = tasks.length;

  // دالة تصنيف المهام بناءً على الحالة بشكل مرن
  const stats = tasks.reduce((acc, task) => {
    const s = task.status?.toLowerCase().trim() || "";

    // 1. تصنيف "قيد التنفيذ"
    if (["in progress", "accepted", "accebted", "active"].includes(s)) {
      acc.inProgress++;
    } 
    // 2. تصنيف "المكتمل"
    else if (["approved", "completed", "done", "finished"].includes(s)) {
      acc.done++;
    } 
    // 3. أي حالة أخرى تعتبر "معلقة أو جديدة"
    else {
      acc.pending++;
    }
    return acc;
  }, { inProgress: 0, done: 0, pending: 0 });

  // استخراج القيم للرسم البياني والكروت
  const { inProgress, done, pending } = stats;

  /* =============================================
      📈 تجهيز بيانات الرسوم البيانية
     ============================================= */

  const companyCounts = {};
  tasks.forEach((t) => {
    if (t.company) {
      companyCounts[t.company] = (companyCounts[t.company] || 0) + 1;
    }
  });

  const typeCounts = {};
  tasks.forEach((t) => {
    if (t.type) {
      typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
    }
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

      {/* الكروت العلوية - أصبحت الآن مرتبطة بالـ state الديناميكي */}
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