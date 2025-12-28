import api from "./apiClient";

/**
 * 1. جلب الإعدادات كاملة (وظيفة عامة يستخدمها الكل)
 */
export const getAllOptions = async () => {
  try {
    const res = await api.get("/options");
    return res.data || { jobTitles: [], priorities: [], statuses: [] };
  } catch (err) {
    console.error("Failed to load options");
    return { jobTitles: [], priorities: [], statuses: [] };
  }
};

/**
 * 2. المسميات الوظيفية (Job Titles)
 */
export const addJobTitle = async (newTitle) => {
  const current = await getAllOptions();
  if (!current.jobTitles.includes(newTitle)) {
    const updated = { ...current, jobTitles: [...current.jobTitles, newTitle] };
    await api.put("/options", updated);
  }
};

export const deleteJobTitle = async (title) => {
  const current = await getAllOptions();
  const updated = { ...current, jobTitles: current.jobTitles.filter(t => t !== title) };
  await api.put("/options", updated);
};

/**
 * 3. الأولوية (Priorities) - للحفاظ على عمل الحقول القديمة
 */
export const addPriority = async (newPriority) => {
  const current = await getAllOptions();
  if (!current.priorities.includes(newPriority)) {
    const updated = { ...current, priorities: [...current.priorities, newPriority] };
    await api.put("/options", updated);
  }
};

export const deletePriority = async (priority) => {
  const current = await getAllOptions();
  const updated = { ...current, priorities: current.priorities.filter(p => p !== priority) };
  await api.put("/options", updated);
};

/**
 * 4. الحالة (Statuses) - للحفاظ على عمل الحقول القديمة
 */
export const addStatus = async (newStatus) => {
  const current = await getAllOptions();
  if (!current.statuses.includes(newStatus)) {
    const updated = { ...current, statuses: [...current.statuses, newStatus] };
    await api.put("/options", updated);
  }
};

export const deleteStatus = async (status) => {
  const current = await getAllOptions();
  const updated = { ...current, statuses: current.statuses.filter(s => s !== status) };
  await api.put("/options", updated);
};