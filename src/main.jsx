import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router/AppRouter";
import "./styles/global.css";

import { AuthProvider } from "./context/AuthContext";

// --- أضف هذا الجزء هنا ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("✅ Service Worker Registered!", reg.scope))
      .catch((err) => console.log("❌ Service Worker registration failed:", err));
  });
}
// -----------------------

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);