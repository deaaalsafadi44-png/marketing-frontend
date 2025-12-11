import api from "./apiClient";

const authService = {
  // نستخدم apiClient بدل axios + localhost
  login: (email, password) =>
    api.post("/login", { email, password }),

  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  me: () => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user || null;
  },
};

export default authService;
