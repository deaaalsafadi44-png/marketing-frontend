import api from "./apiClient";

export const getTasks = () => api.get("/tasks");
export const getTaskById = (id) => api.get(`/tasks/${id}`);
export const addTaskApi = (data) => api.post("/tasks", data);
export const updateTaskApi = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTaskApi = (id) => api.delete(`/tasks/${id}`);

export const getOptions = () => api.get("/options");
export const updateOptions = (data) => api.put("/options", data);

/* =====================================================
    ⭐ TIMER & LOCK API CALLS (NEW)
===================================================== */

// دوال التحكم في التايمر
export const startTimerApi = (id) => api.post(`/tasks/${id}/timer/start`);
export const pauseTimerApi = (id) => api.post(`/tasks/${id}/timer/pause`);
export const resumeTimerApi = (id) => api.post(`/tasks/${id}/timer/resume`);
export const resetTimerApi = (id) => api.post(`/tasks/${id}/timer/reset`);

// دوال القفل (ملاحظات المدير)
export const lockTaskApi = (id) => api.post(`/tasks/${id}/lock`);
export const unlockTaskApi = (id) => api.post(`/tasks/${id}/unlock`);