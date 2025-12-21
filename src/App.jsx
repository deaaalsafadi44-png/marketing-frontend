import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import TasksList from "./pages/Tasks/TasksList";
import AddTask from "./pages/Tasks/AddTask";
import Users from "./pages/Users/Users";
import Submissions from "./pages/Submissions/Submissions";

import PrivateRoute from "./components/PrivateRoute";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* صفحة تسجيل الدخول بدون حماية */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard (Admin فقط) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute roles={["Admin"]}>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Tasks (أي مستخدم مسجّل) */}
        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <TasksList />
            </PrivateRoute>
          }
        />

        {/* Add Task (Admin + Manager) */}
        <Route
          path="/tasks/add"
          element={
            <PrivateRoute roles={["Admin", "Manager"]}>
              <AddTask />
            </PrivateRoute>
          }
        />

        {/* Users (Admin فقط) */}
        <Route
          path="/users"
          element={
            <PrivateRoute roles={["Admin"]}>
              <Users />
            </PrivateRoute>
          }
        />

        {/* ✅ Submissions (أي مستخدم مسجّل) */}
        <Route
          path="/submissions"
          element={
            <PrivateRoute>
              <DeliverablesBoard />
            </PrivateRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
};

export default App;
