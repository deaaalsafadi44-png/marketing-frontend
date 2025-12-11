    import apiClient from "./apiClient";

const reportsService = {
  getSummary: (params) => apiClient.get("/reports/summary", { params }),
  getCharts: () => apiClient.get("/reports/charts"),
};

export default reportsService;
