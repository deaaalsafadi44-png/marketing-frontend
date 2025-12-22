import { createBrowserRouter, Navigate } from "react-router-dom";

// Layout
import MainLayout from "../layout/MainLayout";

// Components
import PrivateRoute from "../components/PrivateRoute";

// Context
import { useAuth } from "../context/AuthContext";

// Pages
import Dashboard from "../pages/Dashboard/Dashboard";
import Unauthorized from "../pages/Unauthorized";

import List from "../pages/Tasks/List";
import Add from "../pages/Tasks/Add";
import ViewTask from "../pages/Tasks/View";
import EditTask from "../pages/Tasks/Edit";

import Reports from "../pages/Reports/Reports";

import Users from "../pages/Users/Users";
import AddUser from "../pages/Users/AddUser";
import EditUser from "../pages/Users/EditUser";

import Settings from "../pages/Settings/Settings";
import ManageOptions from "../pages/Settings/ManageOptions";

import Login from "../pages/Login/Login";

// ✅ ADDED
import DeliverablesBoard from "../pages/deliverables/DeliverablesBoard";

/* ===============================
   ROLE BASED HOME
================================ */
const RoleBasedHome = () => {
  const { user, loading } = useAuth();
  if (loading) return null;

  if (user?.role === "Admin") {
    return <Dashboard />;
  }

  return <Navigate to="/tasks" replace />;
};

/* ===============================
   Error Page
================================ */
const ErrorPage = () => (
  <div style={{ padding: 40, textAlign: "center" }}>
    <h1>404 - Page Not Found</h1>
    <a href="/">← Back</a>
  </div>
);

/* ===============================
   ROUTER
================================ */
export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    errorElement: <ErrorPage />,

    children: [
      {
        index: true,
        element: <RoleBasedHome />,
      },

      // ✅ ADDED – Deliverables Board
      {
        path: "submissions",
        element: (
          <PrivateRoute>
            <DeliverablesBoard />
          </PrivateRoute>
        ),
      },

      // Settings (Admin فقط)
      {
        path: "settings",
        element: (
          <PrivateRoute roles={["Admin"]}>
            <Settings />
          </PrivateRoute>
        ),
      },
      {
        path: "settings/options",
        element: (
          <PrivateRoute roles={["Admin"]}>
            <ManageOptions />
          </PrivateRoute>
        ),
      },

      // Tasks
      {
        path: "tasks",
        children: [
          {
            index: true,
            element: (
              <PrivateRoute>
                <List />
              </PrivateRoute>
            ),
          },
          {
            path: "add",
            element: (
              <PrivateRoute roles={["Admin", "Manager"]}>
                <Add />
              </PrivateRoute>
            ),
          },
          {
            path: "view/:id",
            element: (
              <PrivateRoute>
                <ViewTask />
              </PrivateRoute>
            ),
          },
          {
            path: "edit/:id",
            element: (
              <PrivateRoute roles={["Admin", "Manager"]}>
                <EditTask />
              </PrivateRoute>
            ),
          },
        ],
      },

      // Reports
      {
        path: "reports",
        element: (
          <PrivateRoute roles={["Admin", "Manager"]}>
            <Reports />
          </PrivateRoute>
        ),
      },

      // Users
      {
        path: "users",
        element: (
          <PrivateRoute roles={["Admin"]}>
            <Users />
          </PrivateRoute>
        ),
      },
      {
        path: "users/add",
        element: (
          <PrivateRoute roles={["Admin"]}>
            <AddUser />
          </PrivateRoute>
        ),
      },
      {
        path: "users/edit/:id",
        element: (
          <PrivateRoute roles={["Admin"]}>
            <EditUser />
          </PrivateRoute>
        ),
      },
    ],
  },
]);
