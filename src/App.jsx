import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
        {/* 1. صفحة تسجيل الدخول */}
        <Route path="/login" element={<Login />} />

        {/* 2. الداشبورد (الهوم)
           ✅ التعديل: جعلنا المسار "/" هو الأساسي ليتوافق مع NavLink to="/" في النافبار
           ✅ التعديل: تمرير المصفوفة بشكل صريح لضمان وصولها للـ PrivateRoute
        */}
        <Route
          path="/"
          element={
            <PrivateRoute roles={["Admin", "Manager", "admin", "manager"]}>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* 3. المهام */}
        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <TasksList />
            </PrivateRoute>
          }
        />

        {/* 4. إضافة مهمة */}
        <Route
          path="/tasks/add"
          element={
            <PrivateRoute roles={["Admin", "Manager", "admin", "manager"]}>
              <AddTask />
            </PrivateRoute>
          }
        />

        {/* 5. المستخدمين (أدمن فقط) */}
        <Route
          path="/users"
          element={
            <PrivateRoute roles={["Admin", "admin"]}>
              <Users />
            </PrivateRoute>
          }
        />

        {/* 6. التسليمات */}
        <Route
          path="/submissions"
          element={
            <PrivateRoute>
              <DeliverablesBoard />
            </PrivateRoute>
          }
        />

        {/* ✅ أي مسار غير معروف يوجهه للهوم (الداشبورد للمديرين) */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
};

export default App;