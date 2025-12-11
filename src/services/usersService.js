import api from "./apiClient";
import axios from "axios";

const API_URL = "http://localhost:5000";

// ===============================
// LOGIN
// ===============================
export const loginUser = async (email, password) => {
  const res = await axios.post(`${API_URL}/login`, { email, password });

  localStorage.setItem("accessToken", res.data.accessToken);
  localStorage.setItem("refreshToken", res.data.refreshToken);
  localStorage.setItem("user", JSON.stringify(res.data.user));

  return res;
};

// ===============================
// LOGOUT
// ===============================
export const logoutUser = () => {
  const refreshToken = localStorage.getItem("refreshToken");
  return api.post("/logout", { refreshToken });
};

// ===============================
// USERS CRUD
// ===============================
export const getUsers = () => api.get("/users");
export const getUserById = (id) => api.get(`/users/${id}`);
export const addUserApi = (data) => api.post("/users", data);
export const updateUserApi = (id, data) => api.put(`/users/${id}`, data);
export const deleteUserApi = (id) => api.delete(`/users/${id}`);
