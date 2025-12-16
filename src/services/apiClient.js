import axios from "axios";

/* =========================================
   1️⃣ Environment Detection
========================================= */

const isProd = import.meta.env.MODE === "production";

/* =========================================
   2️⃣ API URLs
========================================= */

const ONLINE_API = "https://marketing-backend-1-db4i.onrender.com";
const LOCAL_API = "http://localhost:5000";

const API_URL = isProd ? ONLINE_API : LOCAL_API;

if (!isProd) {
  console.log("🧪 DEV MODE → API:", API_URL);
}

/* =========================================
   3️⃣ Axios Instance (HttpOnly Cookies)
========================================= */

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ✅ ضروري
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
      originalRequest.url.includes("/refresh") ||
      originalRequest.url.includes("/auth/me") ||
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
        await api.post("/refresh"); // Cookie يُرسل تلقائيًا
        processQueue();
        return api(originalRequest);
      } catch (err) {
        processQueue(err);

        // ⛔ لا Redirect هنا — AuthContext سيتكفّل
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
