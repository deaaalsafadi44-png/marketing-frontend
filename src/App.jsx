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

  </Routes>
</BrowserRouter>
