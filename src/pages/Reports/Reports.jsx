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

const Reports = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [companyFilter, setCompanyFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/tasks");
        setTasks(res.data);
      } catch (err) {
        console.error(err);

        if (err.response?.status === 403) {
          setError("You are not allowed to access reports.");
        } else {
          setError("Failed to load tasks.");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="loading">Loading reports...</div>;
  if (error) return <div className="error-box">{error}</div>;

  // =============================
  // FILTER TASKS
  // =============================
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

  // SUMMARY
  const totalTasks = filteredTasks.length;

  const totalHours = filteredTasks
    .reduce((sum, t) => sum + (t.timeSpent || 0) / 60, 0)
    .toFixed(2);

  const mostCommonTask =
    filteredTasks.length > 0
      ? Object.entries(
          filteredTasks.reduce((acc, t) => {
            acc[t.type] = (acc[t.type] || 0) + 1;
            return acc;
          }, {})
        ).sort((a, b) => b[1] - a[1])[0][0]
      : "—";

  // =============================
  // 🟢 DYNAMIC COMPANIES (MATCH COLORS WITH DASHBOARD)
  // =============================
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

  const companyCounts = {};
  uniqueCompanies.forEach((company) => {
    companyCounts[company] = filteredTasks.filter(
      (t) => t.company === company
    ).length;
  });

  // نفس ترتيب الألوان بين Dashboard و Reports
  const dynamicColors = uniqueCompanies.map(
    (_, i) => dashboardColors[i % dashboardColors.length]
  );

  const pieData = {
    labels: uniqueCompanies,
    datasets: [
      {
        data: Object.values(companyCounts),
        backgroundColor: dynamicColors,
      },
    ],
  };

  // =============================
  // TYPE COUNTS
  // =============================
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

  // =============================
  // MONTHLY HOURS
  // =============================
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
        fill: false,
        tension: 0.3,
      },
    ],
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Tasks Report", 14, 20);

    doc.setFontSize(12);
   doc.text(
  `Total Time: ${formatMinutes(Math.round(totalHours * 60))}`,
  14,
  36
);

   doc.text(
  `Total Time: ${formatMinutesToText(totalHours)}`,
  14,
  36
);

    doc.text(`Most Common Task: ${mostCommonTask}`, 14, 42);

    const tableData = filteredTasks.map((t) => [
      t.company,
      t.type,
      t.assigned,
      t.priority,
      t.status,
      formatMinutesToText(t.timeSpent || 0),

      t.createdAt,
    ]);

    autoTable(doc, {
      startY: 50,
      head: [[
        "Company", "Type", "Assigned", "Priority",
        "Status", "Hours Spent", "Created At"
      ]],
      body: tableData,
    });

    doc.save("Tasks_Report.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredTasks.map((t) => ({
        Company: t.company,
        Type: t.type,
        Assigned: t.assigned,
        Priority: t.priority,
        Status: t.status,
        HoursSpent: formatMinutes(t.timeSpent || 0)
,
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
  };

  return (
    <div className="reports-container">
      <h1 className="reports-title">Reports</h1>

      <div className="filters-row">
        <select onChange={(e) => setCompanyFilter(e.target.value)}>
          <option value="">Company</option>

          {uniqueCompanies.map((company, i) => (
            <option key={i} value={company}>
              {company}
            </option>
          ))}
        </select>

        <input type="date" onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" onChange={(e) => setDateTo(e.target.value)} />

        <button className="export-btn" onClick={exportPDF}>Export PDF</button>
        <button className="export-btn" onClick={exportExcel}>Export Excel</button>
      </div>

      <div className="summary-box">
        <p><strong>Total Tasks:</strong> {totalTasks}</p>
        <p><strong>Total Hours:</strong> {totalHours} hrs</p>
        <p><strong>Most Common Task:</strong> {mostCommonTask}</p>
      </div>

      <div className="charts-row">
        <div className="chart-box">
          <h3>Tasks by Type</h3>
          <Bar data={barData} />
        </div>

        <div className="chart-box">
          <h3>Tasks by Company</h3>
          <Pie data={pieData} />
        </div>
      </div>

      <div className="chart-box" style={{ marginTop: "30px" }}>
        <h3>Hours Over Months</h3>
        <Line data={lineData} />
      </div>
    </div>
  );
};

export default Reports;
