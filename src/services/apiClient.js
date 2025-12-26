import axios from "axios";

const isProd = import.meta.env.MODE === "production";

const ONLINE_API = "https://marketing-backend-1-db4i.onrender.com";
const LOCAL_API = "http://localhost:5000";

const API_URL = isProd ? ONLINE_API : LOCAL_API;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ⭐ هذا وحده يكفي
});

/* =========================================
   4️⃣ Refresh Token Handler (SAFE)
========================================= */

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error = null) => {
  failedQueue.forEach((p) => {
    error ? p.reject(error) : p.resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

   const isAuthEndpoint =
      originalRequest.url.includes("/login") ||
      originalRequest.url.includes("/auth/refresh") || // ✅ المسار الصحيح الذي يحتاجه السيرفر
      originalRequest.url.includes("/auth/me") ||      // 💡 إضافة جيدة لضمان استقرار التحقق من المستخدم
      originalRequest.url.includes("/logout");
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      isRefreshing = true;

      try {
  await api.post("/auth/refresh"); // ✅ أضفنا /auth/ قبل refresh
  processQueue();
  return api(originalRequest);
}catch (err) {
        processQueue(err);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
