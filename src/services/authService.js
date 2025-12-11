import axios from "axios";

const API_URL = "http://localhost:5000";

const authService = {
  login: (email, password) =>
    axios.post(`${API_URL}/login`, { email, password }),

  logout: () => {
    localStorage.removeItem("user");
  },

  me: () => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user || null;
  },
};

export default authService;
