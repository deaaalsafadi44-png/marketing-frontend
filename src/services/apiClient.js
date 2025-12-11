import axios from "axios";

/* =========================================
   1️⃣ إعداد اختيار السيرفر (محلي / أونلاين)
   ========================================= */

// 🔹 رابط السيرفر المرفوع على Render
const ONLINE_API = "https://marketing-backend-brzi.onrender.com";

// 🔹 رابط السيرفر المحلي
const LOCAL_API = "http://localhost:5000";

// 🔹 اختيار تلقائي:  
// إذا كنا على localhost → استخدم المحلي  
// إذا كنا على موقع حقيقي → استخدم الأونلاين
let API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? LOCAL_API
    : ONLINE_API;

// 🔹 يمكنك إجبار النظام يدويًا باستخدام:
// localStorage.setItem("api_mode", "online");
// localStorage.setItem("api_mode", "local");

const mode = localStorage.getItem("api_mode");

if (mode === "online") API_URL = ONLINE_API;
if (mode === "local") API_URL = LOCAL_API;

console.log("🌐 API Running On:", API_URL);

/* =========================================
   2️⃣ Helpers
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

    if (error.response?.status === 401 && !original._retry) {
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
        const res = await axios.post(`${API_URL}/refresh`, { refreshToken });

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
