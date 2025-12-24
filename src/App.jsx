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
        {/* صفحة تسجيل الدخول */}
        <Route path="/login" element={<Login />} />

        {/* ✅ الحل: جعل "/" هو المسار الرئيسي للداشبورد ليتوافق مع Navbar */}
        <Route
          path="/"
          element={
            <PrivateRoute roles={["Admin", "Manager", "admin", "manager"]}> 
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* توجيه احتياطي: أي شخص يدخل /dashboard يدوياً يذهب إلى "/" */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />

        {/* المهام متاحة للجميع */}
        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <TasksList />
            </PrivateRoute>
          }
        />

        {/* إضافة مهمة (أدمن ومانجر) */}
        <Route
          path="/tasks/add"
          element={
            <PrivateRoute roles={["Admin", "Manager", "admin", "manager"]}>
              <AddTask />
            </PrivateRoute>
          }
        />

        {/* المستخدمين (أدمن فقط) */}
        <Route
          path="/users"
          element={
            <PrivateRoute roles={["Admin", "admin"]}>
              <Users />
            </PrivateRoute>
          }
        />

        <Route
          path="/submissions"
          element={
            <PrivateRoute>
              <DeliverablesBoard />
            </PrivateRoute>
          }
        />

        {/* في حال المسار غير موجود */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;