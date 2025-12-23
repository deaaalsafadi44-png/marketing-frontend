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

    const matchCompany =
      companyFilter === "" || task.company === companyFilter;

    const matchDateFrom =
      dateFrom === "" || taskDate >= new Date(dateFrom + " 00:00:00");

    const matchDateTo =
      dateTo === "" || taskDate <= new Date(dateTo + " 23:59:59");

    return matchCompany && matchDateFrom && matchDateTo;
  });

  const uniqueCompanies = [...new Set(filteredTasks.map((t) => t.company))];

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
    labels: uniqueCompanies,
    datasets: [
      {
        data: uniqueCompanies.map(
          (c) => filteredTasks.filter((t) => t.company === c).length
        ),
        backgroundColor: uniqueCompanies.map(
          (_, i) => dashboardColors[i % dashboardColors.length]
        ),
      },
    ],
  };

  const typeCounts = filteredTasks.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {});

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
    monthlyHours[month] += (task.timeSpent || 0) / 60;
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

  /* =============================
     EXPORTS (الإضافة الوحيدة)
  ============================= */
  function exportPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Tasks Report", 14, 20);

    doc.setFontSize(12);
    doc.text(
      `Total Time: ${formatMinutesToText(summary.totalMinutes)}`,
      14,
      36
    );

    doc.text(`Most Common Task: ${summary.mostCommonTask}`, 14, 42);

    autoTable(doc, {
      startY: 50,
      head: [[
        "Company", "Type", "Priority",
        "Status", "Time Spent", "Created At"
      ]],
      body: filteredTasks.map((t) => [
        t.company,
        t.type,
        t.priority,
        t.status,
        formatMinutesToText(t.timeSpent || 0),
        t.createdAt,
      ]),
    });

    doc.save("Tasks_Report.pdf");
  }

  function exportExcel() {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredTasks.map((t) => ({
        Company: t.company,
        Type: t.type,
        Priority: t.priority,
        Status: t.status,
        TimeSpent: formatMinutesToText(t.timeSpent || 0),
        CreatedAt: t.createdAt,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      "Tasks_Report.xlsx"
    );
  }

  return (
    <div className="reports-page">
      <h1 className="reports-title">Reports</h1>

      <div className="reports-card filters-card">
        <select onChange={(e) => setCompanyFilter(e.target.value)}>
          <option value="">Company</option>
          {uniqueCompanies.map((company, i) => (
            <option key={i} value={company}>{company}</option>
          ))}
        </select>

        <input type="date" onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" onChange={(e) => setDateTo(e.target.value)} />

        <button className="export-btn" onClick={exportPDF}>Export PDF</button>
        <button className="export-btn" onClick={exportExcel}>Export Excel</button>
      </div>

      <div className="reports-summary">
        <div className="summary-item">
          <span>Total Tasks</span>
          <strong>{summary.totalTasks}</strong>
        </div>

        <div className="summary-item">
          <span>Total Time</span>
          <strong>{formatMinutesToText(summary.totalMinutes)}</strong>
        </div>

        <div className="summary-item">
          <span>Most Common Task</span>
          <strong>{summary.mostCommonTask}</strong>
        </div>
      </div>

    <div className="reports-card">
  <h3>Tasks by Type</h3>
  <div className="chart-container">
    <Bar data={barData} options={barOptions} />
  </div>



        <div className="reports-card">
          <h3>Tasks by Company</h3>
          <Pie data={pieData} />
        </div>

        <div className="reports-card full">
          <h3>Hours Over Months</h3>
          <Line data={lineData} />
        </div>
      </div>
    </div>
  );
};

export default Reports;
