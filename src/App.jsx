import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // أضفنا Navigate للتحويل

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import TasksList from "./pages/Tasks/TasksList";
import AddTask from "./pages/Tasks/AddTask";
import Users from "./pages/Users/Users";
import DeliverablesBoard from "./pages/deliverables/DeliverablesBoard";
import PrivateRoute from "./components/PrivateRoute";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* صفحة تسجيل الدخول */}
        <Route path="/login" element={<Login />} />

        {/* ✅ تعديل المسار ليتوافق مع Navbar 
           إذا كان النافبار يوجه إلى "/" فاجعل الداشبورد هي الصفحة الرئيسية
        */}
        <Route
          path="/"
          element={
            <PrivateRoute roles={["Admin", "Manager", "admin", "manager"]}> 
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* للاحتياط إذا دخل المستخدم على /dashboard يدوياً */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />

        {/* Tasks */}
        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <TasksList />
            </PrivateRoute>
          }
        />

        {/* Add Task */}
        <Route
          path="/tasks/add"
          element={
            <PrivateRoute roles={["Admin", "Manager", "admin", "manager"]}>
              <AddTask />
            </PrivateRoute>
          }
        />

        {/* Users - للأدمن فقط */}
        <Route
          path="/users"
          element={
            <PrivateRoute roles={["Admin", "admin"]}>
              <Users />
            </PrivateRoute>
          }
        />

        {/* Submissions */}
        <Route
          path="/submissions"
          element={
            <PrivateRoute>
              <DeliverablesBoard />
            </PrivateRoute>
          }
        />
        
        {/* صفحة 404 أو غير مصرح به */}
        <Route path="/unauthorized" element={<h1>Unauthorized Access</h1>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;