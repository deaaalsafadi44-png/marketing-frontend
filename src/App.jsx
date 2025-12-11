<BrowserRouter>
  <Routes>

    {/* صفحة تسجيل الدخول بدون حماية */}
    <Route path="/login" element={<Login />} />

    {/* صفحة Dashboard (Admin فقط) */}
    <Route
      path="/dashboard"
      element={
        <PrivateRoute role="Admin">
          <Dashboard />
        </PrivateRoute>
      }
    />

    {/* صفحة Tasks (جميع المستخدمين) */}
    <Route
      path="/tasks"
      element={
        <PrivateRoute>
          <TasksList />
        </PrivateRoute>
      }
    />

    {/* صفحة Users (Admin فقط) */}
    <Route
      path="/users"
      element={
        <PrivateRoute role="Admin">
          <Users />
        </PrivateRoute>
      }
    />

  </Routes>
</BrowserRouter>
