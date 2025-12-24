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

/* =============================================
    🛠️ دالة جلب الشعار (نفس الدالة المستخدمة في القائمة)
   ============================================= */
const getCompanyLogo = (companyName) => {
  const name = companyName?.toLowerCase().trim();
  if (name === "laffah") return "/logos/laffah.png"; 
  if (name === "healthy family") return "/logos/healthyfamily.png"; 
  if (name === "syrian united co") return "/logos/syrian united co.png"; 
  return "/logos/laffah.png"; 
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getTasks();
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
  
  const getCountByStatus = (statusName) => {
    return tasks.filter((t) => {
      const s = t.status?.toLowerCase().trim() || "";
      return s === statusName.toLowerCase().trim();
    }).length;
  };

  const stats = {
    total: tasks.length,
    new: getCountByStatus("New"),
    accepted: getCountByStatus("Accepted") + getCountByStatus("Accebted"),
    inProgress: getCountByStatus("In progress"),
    underReview: getCountByStatus("Under review"),
    approved: getCountByStatus("Approved")
  };

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
    plugins: { 
        legend: { 
            position: "top",
            labels: {
                padding: 20,
                font: { size: 14 }
            }
        } 
    },
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

      <div className="stats-row" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
        gap: '15px',
        marginBottom: '25px'
      }}>
        <StatCard title="Total Tasks" value={stats.total} border="black" />
        <StatCard title="New" value={stats.new} border="blue" />
        <StatCard title="Accepted" value={stats.accepted} border="orange" />
        <StatCard title="In Progress" value={stats.inProgress} border="gold" />
        <StatCard title="Under Review" value={stats.underReview} border="purple" />
        <StatCard title="Approved" value={stats.approved} border="green" />
      </div>

      <div className="charts-row">
        <div className="chart-box">
          <h3 className="chart-title">توزيع المهام حسب الشركة</h3>
          
          {/* ✅ إضافة قائمة الشعارات فوق الرسم البياني للشركة */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {Object.keys(companyCounts).map((company, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                <img 
                  src={getCompanyLogo(company)} 
                  alt="logo" 
                  style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'contain', border: '1px solid #ddd' }} 
                />
                <span>{company}</span>
              </div>
            ))}
          </div>

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