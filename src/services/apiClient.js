import axios from "axios";

/* =========================================
   1️⃣ Server Selection (Local / Online)
   ========================================= */

// ✅ الرابط الصحيح الجديد للباك (Render)
const ONLINE_API = "https://marketing-backend-1-db4i.onrender.com";

// 🔹 السيرفر المحلي
const LOCAL_API = "http://localhost:5000";

// 🔹 الافتراضي: أونلاين
let API_URL = ONLINE_API;

// 🔹 تبديل يدوي (للتطوير)
const mode = localStorage.getItem("api_mode");
if (mode === "local") API_URL = LOCAL_API;
if (mode === "online") API_URL = ONLINE_API;

console.log("🌐 API Running On:", API_URL);

/* =========================================
   2️⃣ Token Helpers
   ========================================= */
const getAccessToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");
const saveAccessToken = (token) => localStorage.setItem("accessToken", token);

/* =========================================
   3️⃣ Axios Instance
   ========================================= */
const api = axios.create({
  baseURL: API_URL,
});

/* =========================================
   4️⃣ Attach Access Token
   ========================================= */
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

/* =========================================
   5️⃣ Refresh Token Handler
   ========================================= */
let isRefreshing = false;
let failedQueue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url.includes("/login")
    ) {
      original._retry = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = "Bearer " + token;
          return api(original);
        });
      }

      isRefreshing = true;

      try {
        const res = await api.post("/refresh", { refreshToken });

        const newAccessToken = res.data.accessToken;
        saveAccessToken(newAccessToken);

        failedQueue.forEach((p) => p.resolve(newAccessToken));
        failedQueue = [];
        isRefreshing = false;

        original.headers.Authorization = "Bearer " + newAccessToken;
        return api(original);

      } catch (err) {
        failedQueue.forEach((p) => p.reject(err));
        failedQueue = [];
        isRefreshing = false;

        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
