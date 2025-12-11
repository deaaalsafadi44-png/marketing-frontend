// 🔥 Default values
const DEFAULT_PRIORITY = ["Low", "Medium", "High", "Critical"];
const DEFAULT_STATUS = ["New", "In Progress", "Completed"];

// ⏳ Load from LocalStorage or defaults
export const getPriorityList = () => {
  return JSON.parse(localStorage.getItem("priorityList")) || DEFAULT_PRIORITY;
};

export const getStatusList = () => {
  return JSON.parse(localStorage.getItem("statusList")) || DEFAULT_STATUS;
};

// ➕ إضافة عنصر جديد
export const addPriority = (value) => {
  const list = getPriorityList();
  list.push(value);
  localStorage.setItem("priorityList", JSON.stringify(list));
};

export const addStatus = (value) => {
  const list = getStatusList();
  list.push(value);
  localStorage.setItem("statusList", JSON.stringify(list));
};

// ❌ حذف عنصر
export const deletePriority = (value) => {
  const list = getPriorityList().filter((item) => item !== value);
  localStorage.setItem("priorityList", JSON.stringify(list));
};

export const deleteStatus = (value) => {
  const list = getStatusList().filter((item) => item !== value);
  localStorage.setItem("statusList", JSON.stringify(list));
};
