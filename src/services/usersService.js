import api from "./apiClient";

/* ===============================
   LOGIN (HttpOnly Cookies)
================================ */
export const loginUser = async (email, password) => {
  // السيرفر يضبط Cookies ويرجع user فقط
  const res = await api.post("/login", { email, password });

  return res;
};

/* ===============================
   LOGOUT (Cookies-safe)
================================ */
export const logoutUser = async () => {
  // لا نرسل توكنات – السيرفر يحذف الكوكيز
  return api.post("/logout");
};

/* ===============================
   USERS CRUD
================================ */
export const getUsers = () => api.get("/users");

export const getUserById = (id) => api.get(`/users/${id}`);

export const addUserApi = (data) => api.post("/users", data);

export const updateUserApi = (id, data) =>
  api.put(`/users/${id}`, data);

export const deleteUserApi = (id) =>
  api.delete(`/users/${id}`);
