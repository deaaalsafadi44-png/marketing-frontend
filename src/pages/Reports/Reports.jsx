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
  const [statusFilter, setStatusFilter] = useState(""); 
  const [statusOptions, setStatusOptions] = useState([]); // لتخزين الحالات القادمة من السيتينغس
  const [users, setUsers] = useState([]); 

useEffect(() => {
  const loadData = async () => {
    try {
      // 1. جلب البيانات الأساسية (Tasks & Users)
      const resTasks = await api.get("/tasks");
      setTasks(resTasks.data);

      const resUsers = await api.get("/users");
      setUsers(resUsers.data || []);

      // 2. جلب الخيارات من الرابط الصحيح "/options"
      // وضعناها في try/catch منفصل لضمان استمرار الصفحة حتى لو فشل هذا الطلب
      try {
        const resOpts = await api.get("/options"); // تم تعديل المسار هنا
        if (resOpts.data && resOpts.data.status) {
          setStatusOptions(resOpts.data.status);
        }
      } catch (optErr) {
        console.error("Dynamic options failed to load:", optErr);
      }

    } catch (err) {
      console.error("Critical Error loading data:", err);
      setError("Failed to load initial data.");
    } finally {
      // إنهاء حالة التحميل في كل الأحوال
      setLoading(false);
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

    // عنوان التقرير الرئيسي
    doc.setFontSize(18);
    doc.setTextColor(25, 118, 210); // لون أزرق احترافي
    doc.text("Detailed Performance Report", 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${today}`, 14, 22);
    doc.text(`Total Tasks in Report: ${localTotalTasks}`, 14, 27);
    doc.text(`Overall Time: ${formatMinutesToHM(localTotalMinutes)}`, 14, 32);

    let finalY = 40; // نقطة البداية للرسم

    // 1. تجميع المهام حسب الموظف
    const workersNames = [...new Set(filteredTasks.map(t => t.workerName || "Unassigned"))];

    workersNames.forEach((worker) => {
      const workerTasks = filteredTasks.filter(t => t.workerName === worker);
      
      // حساب إحصائيات الموظف الحالي
      const workerTotalTasks = workerTasks.length;
      const workerTotalMinutes = workerTasks.reduce((acc, t) => {
        const mins = t.timer?.totalSeconds ? Math.floor(t.timer.totalSeconds / 60) : t.timeSpent || 0;
        return acc + mins;
      }, 0);

      // إضافة اسم الموظف كعنوان جانبي
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`Employee: ${worker}`, 14, finalY + 10);
      
      doc.setFontSize(10);
      doc.setTextColor(50);
      doc.text(`Tasks: ${workerTotalTasks} | Time Spent: ${formatMinutesToHM(workerTotalMinutes)}`, 14, finalY + 16);

      // 2. بناء الجدول الخاص بهذا الموظف مع إضافة عمود الحالة
      const tableData = workerTasks.map((t) => [
        t.id,
        t.company || "-",
        t.type || "-",
        t.status || "New", // عمود الحالة الجديد
        formatMinutesToHM(t.timer?.totalSeconds ? Math.floor(t.timer.totalSeconds / 60) : t.timeSpent),
      ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [["ID", "Company", "Task Type", "Status", "Duration"]],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [46, 125, 50] }, // لون أخضر للجداول
        margin: { left: 14 },
        didDrawPage: (data) => {
          finalY = data.cursor.y; // تحديث الإحداثي Y لكي لا تتداخل الجداول
        }
      });

      finalY = doc.lastAutoTable.finalY + 10; // إضافة مساحة قبل الموظف التالي

      // التحقق من المساحة المتبقية في الصفحة لإضافة صفحة جديدة إذا لزم الأمر
      if (finalY > 250) {
        doc.addPage();
        finalY = 20;
      }
    });

    doc.save(`Performance-Report-${new Date().toLocaleDateString()}.pdf`);
  }

 function exportExcel() {
    const workbook = XLSX.utils.book_new();
    let finalData = [];

    // 1. الحصول على قائمة الموظفين الفريدة
    const workersNames = [...new Set(filteredTasks.map(t => t.workerName || "Unassigned"))];

    workersNames.forEach((worker) => {
      const workerTasks = filteredTasks.filter(t => t.workerName === worker);

      // حساب الإحصائيات الخاصة بهذا الموظف
      const workerTotalTasks = workerTasks.length;
      const workerTotalMinutes = workerTasks.reduce((acc, t) => {
        const mins = t.timer?.totalSeconds ? Math.floor(t.timer.totalSeconds / 60) : t.timeSpent || 0;
        return acc + mins;
      }, 0);

      // إضافة سطر عنوان باسم الموظف (لتمييزه في الإكسيل)
      finalData.push({ 
        ID: `--- Employee: ${worker.toUpperCase()} ---`, 
        Company: "", 
        Type: "", 
        Status: "", 
        Time: "" 
      });

      // إضافة مهام هذا الموظف مع عمود الحالة
      workerTasks.forEach(t => {
        finalData.push({
          ID: t.id,
          Company: t.company || "-",
          Type: t.type || "-",
          Status: t.status || "New", // إضافة عمود الحالة
          Time: formatMinutesToHM(t.timer?.totalSeconds ? Math.floor(t.timer.totalSeconds / 60) : t.timeSpent),
        });
      });

      // إضافة سطر ملخص لهذا الموظف
      finalData.push({
        ID: "Summary:",
        Company: `Total Tasks: ${workerTotalTasks}`,
        Type: "",
        Status: "Total Time:",
        Time: formatMinutesToHM(workerTotalMinutes),
      });

      // إضافة سطر فارغ للفصل بين الموظفين
      finalData.push({ ID: "", Company: "", Type: "", Status: "", Time: "" });
    });

    // تحويل البيانات المجمعة إلى شيت إكسيل
    const tasksSheet = XLSX.utils.json_to_sheet(finalData);

    // تحسين عرض الأعمدة (اختياري لجعل الملف أرتب)
    tasksSheet["!cols"] = [
      { wch: 25 }, // ID/Name
      { wch: 20 }, // Company
      { wch: 20 }, // Type
      { wch: 15 }, // Status
      { wch: 15 }, // Time
    ];

    XLSX.utils.book_append_sheet(workbook, tasksSheet, "Staff Performance");

    // استخراج الملف
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `Staff-Report-${new Date().toLocaleDateString()}.xlsx`);
  }

  return (
    <div className="reports-page">
      <h1 className="reports-title">Reports Dashboard</h1>

      <div className="reports-controls-container">
    <div className="filters-group">
  {/* 1. فلتر الموظف */}
  <div className="filter-item">
    <label>Employee</label>
    <select value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)}>
      <option value="">All Employees</option>
      {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
    </select>
  </div>

  {/* 2. فلتر الحالة (الديناميكي فقط) */}
  <div className="filter-item">
    <label>Status</label>
    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
      <option value="">All Status</option>
      {/* هذا هو الربط الصحيح مع السيتينغس */}
      {statusOptions.map((s, i) => (
        <option key={i} value={s}>
          {s}
        </option>
      ))}
    </select>
  </div>

  {/* 3. فلتر الشركة */}
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