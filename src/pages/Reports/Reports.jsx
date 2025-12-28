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
  // 1. التحقق من القيم الفارغة أو الصفرية
  if (!minutes || minutes <= 0) return "0 minutes";

  // 2. تحويل الدقائق العشرية إلى إجمالي ثوانٍ (لحل مشكلة الأرقام الطويلة)
  const totalSeconds = Math.round(minutes * 60);

  // 3. توزيع الثواني على ساعات ودقائق وثوانٍ
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  // 4. بناء مصفوفة النصوص للعرض بشكل مرن
  const parts = [];
  if (h > 0) parts.push(`${h} hour${h > 1 ? "s" : ""}`);
  if (m > 0) parts.push(`${m} minute${m > 1 ? "s" : ""}`);
  if (s > 0) parts.push(`${s} second${s > 1 ? "s" : ""}`);

  // 5. دمج النصوص بفاصلة (أو عرض 0 minutes إذا كانت النتيجة فارغة)
  return parts.length > 0 ? parts.join(", ") : "0 minutes";
};

const Reports = () => {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [companyFilter, setCompanyFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
const [workerFilter, setWorkerFilter] = useState(""); // لتخزين ID الموظف المختار
  const [users, setUsers] = useState([]); // لتخزين قائمة الموظفين من السيستم

  useEffect(() => {
    const loadData = async () => {
      try {
        const resTasks = await api.get("/tasks");
        setTasks(resTasks.data);

        // جلب الموظفين لعرضهم في الفلتر
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
    
    // ✅ إضافة شرط الموظف هنا
    const matchWorker = workerFilter === "" || Number(task.workerId) === Number(workerFilter);

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

    // تأكد من إضافة matchWorker في النتيجة النهائية
    return matchCompany && matchDateFrom && matchDateTo && matchWorker;
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
      <h1 className="reports-title">Reports Dashboard</h1>

      {/* --- قسم الفلاتر والأزرار --- */}
      <div className="reports-controls-container">
        <div className="filters-group">
          <div className="filter-item">
            <label>Employee</label>
            <select value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)}>
              <option value="">All Employees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Company</label>
            <div className="select-with-logo">
              {companyFilter && (
                <img src={getCompanyLogo(companyFilter)} alt="logo" className="mini-logo-inside" />
              )}
              <select 
                value={companyFilter} 
                onChange={(e) => setCompanyFilter(e.target.value)}
                style={{ paddingLeft: companyFilter ? '35px' : '12px' }}
              >
                <option value="">All Companies</option>
                {allUniqueCompanies.map((company, i) => (
                  <option key={i} value={company}>{company}</option>
                ))}
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
          <button className="btn-export pdf" onClick={exportPDF}>
            <span className="icon">📄</span> Export PDF
          </button>
          <button className="btn-export excel" onClick={exportExcel}>
            <span className="icon">📊</span> Export Excel
          </button>
        </div>
      </div>

      {/* --- ملخص البيانات --- */}
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

      {/* --- الرسوم البيانية --- */}
      <div className="reports-charts">
        <div className="reports-card">
          <h3>Tasks by Type</h3>
          <div className="chart-container">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* تعديل الكلاس هنا لتوسيط الدائرة */}
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
          <div className="chart-container">
            <Line data={lineData} />
          </div>
        </div>
      </div>

      {/* --- ✅ إضافة الجدول بعرض كامل في الأسفل --- */}
      <div className="table-container-full">
        <h3>Detailed Report</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Company</th>
              <th>Task Type</th>
              <th>Worker</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((t) => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td>
                    <img src={getCompanyLogo(t.company)} className="table-logo" alt="logo" />
                    {t.company || "-"}
                  </td>
                  <td>{t.type || "-"}</td>
                  <td>{t.workerName || "-"}</td>
                  <td>
                    {formatMinutesToHM(t.timer?.totalSeconds ? Math.floor(t.timer.totalSeconds / 60) : t.timeSpent)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No tasks found for the selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Reports;