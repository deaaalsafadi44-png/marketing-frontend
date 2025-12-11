import { createBrowserRouter, Navigate } from "react-router-dom";

// Layout
import MainLayout from "../layout/MainLayout";

// Components
import PrivateRoute from "../components/PrivateRoute";

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

// ===============================
// Redirect Logged-in User
// ===============================
const RedirectLoggedIn = () => {
  const user = localStorage.getItem("user");
  const refresh = localStorage.getItem("refreshToken");

  if (user && refresh) return <Navigate to="/" replace />;
  return <Login />;
};

// ===============================
// Error Page
// ===============================
const ErrorPage = () => (
  <div style={{ padding: 40, textAlign: "center" }}>
    <h1>404 - Page Not Found</h1>
    <a href="/">← Back</a>
  </div>
);

// ===============================
// ROUTER
// ===============================
export const router = createBrowserRouter([
  // Login
  {
    path: "/login",
    element: <RedirectLoggedIn />,
  },

  // Unauthorized
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },

  // Protected Routes
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
        element: (
          <PrivateRoute role="Admin">
            <Dashboard />
          </PrivateRoute>
        ),
      },

      // Settings
      {
        path: "settings",
        element: (
          <PrivateRoute role="Admin">
            <Settings />
          </PrivateRoute>
        ),
      },
      {
        path: "settings/options",
        element: (
          <PrivateRoute role="Admin">
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
              <PrivateRoute role="Admin">
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
              <PrivateRoute role={["Admin", "Manager"]}>
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
          <PrivateRoute role={["Admin", "Manager"]}>
            <Reports />
          </PrivateRoute>
        ),
      },

      // Users
      {
        path: "users",
        element: (
          <PrivateRoute role="Admin">
            <Users />
          </PrivateRoute>
        ),
      },
      {
        path: "users/add",
        element: (
          <PrivateRoute role="Admin">
            <AddUser />
          </PrivateRoute>
        ),
      },
      {
        path: "users/edit/:id",
        element: (
          <PrivateRoute role="Admin">
            <EditUser />
          </PrivateRoute>
        ),
      },
    ],
  },
]);
