import "./reports.css";
import { useEffect, useState } from "react";
import api from "../../services/apiClient";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

/* =============================================
    🛠️ دالة جلب الشعار
   ============================================= */
const getCompanyLogo = (companyName) => {
  const name = companyName?.toLowerCase().trim();
  if (name === "laffah") return "/logos/laffah.png"; 
  if (name === "healthy family") return "/logos/healthyfamily.png"; 
  if (name === "syrian united co") return "/logos/syrian united co.png"; 
  return "/logos/laffah.png"; 
};

/* =============================
    UTIL: FORMAT MINUTES
============================= */
const formatMinutesToText = (minutes) => {
  if (!minutes || minutes <= 0) return "0 minutes";
  const totalSeconds = Math.round(minutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h} hour${h > 1 ? "s" : ""}`);
  if (m > 0) parts.push(`${m} minute${m > 1 ? "s" : ""}`);
  if (s > 0) parts.push(`${s} second${s > 1 ? "s" : ""}`);
  return parts.length > 0 ? parts.join(", ") : "0 minutes";
};

const formatMinutesToHM = (minutes) => {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const Reports = () => {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [workerFilter, setWorkerFilter] = useState(""); 
  const [statusFilter, setStatusFilter] = useState(""); // الحالة الجديدة لفلتر الستاتوس
  const [users, setUsers] = useState([]); 

  useEffect(() => {
    const loadData = async () => {
      try {
        const resTasks = await api.get("/tasks");
        setTasks(resTasks.data);
        const resUsers = await api.get("/users"); 
        setUsers(resUsers.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load initial data.");
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/reports/summary", {
          params: {
            company: companyFilter || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          },
        });
        setSummary(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load summary.");
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, [companyFilter, dateFrom, dateTo]);

  if (loading) return <div className="loading">Loading reports...</div>;
  if (error) return <div className="error-box">{error}</div>;
  if (!summary) return <div className="loading">Preparing summary...</div>;

  const filteredTasks = tasks.filter((task) => {
    if (!task.createdAt) return false;
    const taskDate = new Date(task.createdAt);
    const matchCompany = companyFilter === "" || task.company === companyFilter;
    const matchWorker = workerFilter === "" || Number(task.workerId) === Number(workerFilter);

const matchStatus = statusFilter === "" || task.status === statusFilter;

    let matchDateFrom = true;
    if (dateFrom) {
      const dFrom = new Date(dateFrom);
      dFrom.setHours(0, 0, 0, 0);
      matchDateFrom = taskDate >= dFrom;
    }
    let matchDateTo = true;
    if (dateTo) {
      const dTo = new Date(dateTo);
      dTo.setHours(23, 59, 59, 999);
      matchDateTo = taskDate <= dTo;
    }
return matchCompany && matchDateFrom && matchDateTo && matchWorker && matchStatus;  });

  const localTotalTasks = filteredTasks.length;
  const localTotalMinutes = filteredTasks.reduce((acc, task) => {
    const mins = task.timer?.totalSeconds ? Math.floor(task.timer.totalSeconds / 60) : task.timeSpent || 0;
    return acc + mins;
  }, 0);

  const allUniqueCompanies = [...new Set(tasks.map((t) => t.company).filter(Boolean))];
  const uniqueCompaniesForCharts = [...new Set(filteredTasks.map((t) => t.company))];

  const dashboardColors = ["#1976d2", "#26a69a", "#ffca28", "#ef5350", "#8e24aa", "#4caf50", "#ffa726", "#42a5f5"];

  const pieData = {
    labels: uniqueCompaniesForCharts,
    datasets: [{
      data: uniqueCompaniesForCharts.map(c => filteredTasks.filter(t => t.company === c).length),
      backgroundColor: uniqueCompaniesForCharts.map((_, i) => dashboardColors[i % dashboardColors.length]),
    }],
  };

  const typeCounts = filteredTasks.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {});

  const localMostCommonTask = Object.entries(typeCounts).length > 0
    ? Object.entries(typeCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
    : "—";

  const barData = {
    labels: Object.keys(typeCounts),
    datasets: [{ label: "Tasks", data: Object.values(typeCounts), backgroundColor: "#1976d2" }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
    scales: {
      y: { beginAtZero: true },
      x: {
        ticks: {
          maxRotation: 0, minRotation: 0, autoSkip: false,
          callback: function (value) {
            const label = this.getLabelForValue(value);
            return label.length > 10 ? label.slice(0, 10) + "…" : label;
          },
        },
      },
    },
  };

  const monthlyHours = Array(12).fill(0);
  filteredTasks.forEach((task) => {
    const month = new Date(task.createdAt).getMonth();
    const minutes = task.timer?.totalSeconds ? Math.floor(task.timer.totalSeconds / 60) : task.timeSpent || 0;
    monthlyHours[month] += minutes / 60;
  });

  const lineData = {
    labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    datasets: [{ label: "Hours per Month", data: monthlyHours, borderColor: "#2e7d32", backgroundColor: "#2e7d32", tension: 0.3 }],
  };

  function exportPDF() {
    const doc = new jsPDF();
    const today = new Date().toLocaleString();
    doc.setFontSize(16); doc.text("Tasks Report", 14, 15);
    doc.setFontSize(10); doc.text(`Date: ${today}`, 14, 28);
    doc.text(`Total Tasks: ${localTotalTasks}`, 14, 48);
    doc.text(`Total Time: ${formatMinutesToHM(localTotalMinutes)}`, 14, 54);

    const tableData = filteredTasks.map((t) => [
      t.id, t.company || "-", t.type || "-", t.workerName || "-",
      formatMinutesToHM(t.timer?.totalSeconds ? Math.floor(t.timer.totalSeconds / 60) : t.timeSpent),
    ]);

    autoTable(doc, { startY: 70, head: [["ID", "Company", "Type", "Worker", "Time"]], body: tableData });
    doc.save("tasks-report.pdf");
  }

  function exportExcel() {
    const tasksData = filteredTasks.map((t) => ({
      ID: t.id, Company: t.company, Type: t.type, Worker: t.workerName,
      Time: formatMinutesToHM(t.timer?.totalSeconds ? Math.floor(t.timer.totalSeconds / 60) : t.timeSpent),
    }));
    const workbook = XLSX.utils.book_new();
    const tasksSheet = XLSX.utils.json_to_sheet(tasksData);
    XLSX.utils.book_append_sheet(workbook, tasksSheet, "Tasks");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "tasks-report.xlsx");
  }

  return (
    <div className="reports-page">
      <h1 className="reports-title">Reports Dashboard</h1>

      <div className="reports-controls-container">
        <div className="filters-group">
          <div className="filter-item">
            <label>Employee</label>
            <select value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)}>
              <option value="">All Employees</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
{/* إضافة فلتر الحالة بعد فلتر الشركة */}
<div className="filter-item">
  <label>Status</label>
  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
    <option value="">All Status</option>
    <option value="Pending">Pending</option>
    <option value="Accepted">Accepted</option>
    <option value="In Progress">In Progress</option>
    <option value="Completed">Completed</option>
    <option value="Canceled">Canceled</option>
  </select>
</div>
          <div className="filter-item">
            <label>Company</label>
            <div className="select-with-logo">
              {companyFilter && <img src={getCompanyLogo(companyFilter)} alt="logo" className="mini-logo-inside" />}
              <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} style={{ paddingLeft: companyFilter ? '35px' : '12px' }}>
                <option value="">All Companies</option>
                {allUniqueCompanies.map((company, i) => <option key={i} value={company}>{company}</option>)}
              </select>
            </div>
          </div>

          <div className="filter-item">
            <label>From Date</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="filter-item">
            <label>To Date</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>

        <div className="export-group">
          <button className="btn-export pdf" onClick={exportPDF}><span className="icon">📄</span> Export PDF</button>
          <button className="btn-export excel" onClick={exportExcel}><span className="icon">📊</span> Export Excel</button>
        </div>
      </div>

      <div className="reports-summary">
        <div className="summary-item"><span>Total Tasks</span><strong>{localTotalTasks}</strong></div>
        <div className="summary-item"><span>Total Time</span><strong>{formatMinutesToText(localTotalMinutes)}</strong></div>
        <div className="summary-item"><span>Most Common Task</span><strong>{localMostCommonTask}</strong></div>
      </div>

      <div className="reports-charts">
        <div className="reports-card">
          <h3>Tasks by Type</h3>
          <div className="chart-container"><Bar data={barData} options={barOptions} /></div>
        </div>

        <div className="reports-card">
          <h3>Tasks by Company</h3>
          <div className="company-logos-legend">
            {uniqueCompaniesForCharts.map((company, index) => (
              <div key={index} className="legend-item">
                <img src={getCompanyLogo(company)} alt="logo" />
                <span>{company}</span>
              </div>
            ))}
          </div>
          <div className="chart-container-pie">
            <Pie data={pieData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="reports-card full">
          <h3>Hours Over Months</h3>
          <div className="chart-container"><Line data={lineData} /></div>
        </div>
      </div>
    </div>
  );
};

export default Reports;