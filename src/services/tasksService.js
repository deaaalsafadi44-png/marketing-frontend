import api from "./apiClient";

export const getTasks = () => api.get("/tasks");
export const getTaskById = (id) => api.get(`/tasks/${id}`);
export const addTaskApi = (data) => api.post("/tasks", data);
export const updateTaskApi = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTaskApi = (id) => api.delete(`/tasks/${id}`);

export const getOptions = () => api.get("/options");
export const updateOptions = (data) => api.put("/options", data);
