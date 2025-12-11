import { useState } from "react";
import tasksService from "../services/tasksService";

const useTasks = () => {
  const [loading, setLoading] = useState(false);

  const createTask = async (data) => {
    setLoading(true);
    try {
      await tasksService.create(data);
      alert("Task Created Successfully!");
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    setLoading(true);
    try {
      await tasksService.delete(id);
      alert("Task Deleted");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createTask,
    deleteTask,
  };
};

export default useTasks;
