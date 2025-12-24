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
    🛠️ دالة جلب الشعار (المسارات الموحدة)
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

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h > 0 && m > 0)
    return `${h} hour${h > 1 ? "s" : ""}, ${m} minute${m > 1 ? "s" : ""}`;
  if (h > 0) return `${h} hour${h > 1 ? "s" : ""}`;
  return `${m} minute${m > 1 ? "s" : ""}`;
};

const Reports = () => {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [companyFilter, setCompanyFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await api.get("/tasks");
        setTasks(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load tasks.");
      }
    };

    loadTasks();
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

    return matchCompany && matchDateFrom && matchDateTo;
  });

  const localTotalTasks = filteredTasks.length;
  const localTotalMinutes = filteredTasks.reduce((acc, task) => {
    const mins = task.timer?.totalSeconds
      ? Math.floor(task.timer.totalSeconds / 60)
      : task.timeSpent || 0;
    return acc + mins;
  }, 0);

  const allUniqueCompanies = [...new Set(tasks.map((t) => t.company).filter(Boolean))];
  const uniqueCompaniesForCharts = [...new Set(filteredTasks.map((t) => t.company))];

  const dashboardColors = [
    "#1976d2",
    "#26a69a",
    "#ffca28",
    "#ef5350",
    "#8e24aa",
    "#4caf50",
    "#ffa726",
    "#42a5f5",
  ];

  const pieData = {
    labels: uniqueCompaniesForCharts,
    datasets: [
      {
        data: uniqueCompaniesForCharts.map(
          (c) => filteredTasks.filter((t) => t.company === c).length
        ),
        backgroundColor: uniqueCompaniesForCharts.map(
          (_, i) => dashboardColors[i % dashboardColors.length]
        ),
      },
    ],
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
    datasets: [
      {
        label: "Tasks",
        data: Object.values(typeCounts),
        backgroundColor: "#1976d2",
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

  const monthlyHours = Array(12).fill(0);

  filteredTasks.forEach((task) => {
    const month = new Date(task.createdAt).getMonth();

    const minutes =
      task.timer?.totalSeconds
        ? Math.floor(task.timer.totalSeconds / 60)
        : task.timeSpent || 0;

    monthlyHours[month] += minutes / 60;
  });

  const lineData = {
    labels: [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec",
    ],
    datasets: [
      {
        label: "Hours per Month",
        data: monthlyHours,
        borderColor: "#2e7d32",
        backgroundColor: "#2e7d32",
        tension: 0.3,
      },
    ],
  };

  const formatMinutesToHM = (minutes) => {
    if (!minutes || minutes <= 0) return "0m";

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  function exportPDF() {
    const doc = new jsPDF();
    const userName = "System User";
    const today = new Date().toLocaleString();

    doc.setFontSize(16);
    doc.text("Tasks Report", 14, 15);

    doc.setFontSize(10);
    doc.text(`Generated by: ${userName}`, 14, 22);
    doc.text(`Date: ${today}`, 14, 28);

    doc.setFontSize(12);
    doc.text("Summary", 14, 40);

    doc.setFontSize(10);
    doc.text(`Total Tasks: ${localTotalTasks}`, 14, 48);
    doc.text(`Total Time: ${formatMinutesToHM(localTotalMinutes)}`, 14, 54);
    doc.text(`Most Common Task: ${localMostCommonTask}`, 14, 60);

    const tableData = filteredTasks.map((t) => [
      t.id,
      t.company || "-",
      t.type || "-",
      t.workerName || "-",
      formatMinutesToHM(t.timer?.totalSeconds ? Math.floor(t.timer.totalSeconds / 60) : t.timeSpent),
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["ID", "Company", "Type", "Worker", "Time"]],
      body: tableData,
    });

    doc.save("tasks-report.pdf");
  }

  function exportExcel() {
    const userName = "System User";
    const today = new Date().toLocaleString();

    const summarySheetData = [
      { Field: "Generated By", Value: userName },
      { Field: "Date", Value: today },
      { Field: "Total Tasks", Value: localTotalTasks },
      { Field: "Total Time", Value: formatMinutesToHM(localTotalMinutes) },
      { Field: "Most Common Task", Value: localMostCommonTask },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summarySheetData);

    const tasksData = filteredTasks.map((t) => ({
      ID: t.id,
      Company: t.company,
      Type: t.type,
      Worker: t.workerName,
      Time: formatMinutesToHM(t.timer?.totalSeconds ? Math.floor(t.timer.totalSeconds / 60) : t.timeSpent),
    }));

    const tasksSheet = XLSX.utils.json_to_sheet(tasksData);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, tasksSheet, "Tasks");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "tasks-report.xlsx");
  }

  return (
    <div className="reports-page">
      <h1 className="reports-title">Reports</h1>

      <div className="reports-card filters-card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {/* ✅ فلتر الشركات مع عرض لوغو الشركة المختارة بجانبه إن وُجدت */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           {companyFilter && (
             <img 
               src={getCompanyLogo(companyFilter)} 
               alt="selected-logo" 
               style={{ width: '25px', height: '25px', borderRadius: '50%', border: '1px solid #ddd' }}
             />
           )}
           <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
             <option value="">All Companies</option>
             {allUniqueCompanies.map((company, i) => (
               <option key={i} value={company}>{company}</option>
             ))}
           </select>
        </div>

        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />

        <button className="export-btn" onClick={exportPDF}>Export PDF</button>
        <button className="export-btn" onClick={exportExcel}>Export Excel</button>
      </div>

      <div className="reports-summary">
        <div className="summary-item">
          <span>Total Tasks</span>
          <strong>{localTotalTasks}</strong>
        </div>
        <div className="summary-item">
          <span>Total Time</span>
          <strong>{formatMinutesToText(localTotalMinutes)}</strong>
        </div>
        <div className="summary-item">
          <span>Most Common Task</span>
          <strong>{localMostCommonTask}</strong>
        </div>
      </div>

      <div className="reports-charts">
        <div className="reports-card">
          <h3>Tasks by Type</h3>
          <div className="chart-container">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        <div className="reports-card">
          <h3>Tasks by Company</h3>
          {/* ✅ إضافة قائمة الشعارات المصورة فوق الرسم البياني */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {uniqueCompaniesForCharts.map((company, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
                <img 
                  src={getCompanyLogo(company)} 
                  alt="logo" 
                  style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'contain' }} 
                />
                <span>{company}</span>
              </div>
            ))}
          </div>
          <div className="chart-container">
            <Pie data={pieData} />
          </div>
        </div>

        <div className="reports-card full">
          <h3>Hours Over Months</h3>
          <div className="chart-container">
            <Line data={lineData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;