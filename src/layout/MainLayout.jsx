import Navbar from "../components/Navbar";
import { Outlet, useLocation } from "react-router-dom";
import "./MainLayout.css";

const MainLayout = () => {
  const location = useLocation();

  // صفحات بخلفية كاملة
  const fullBgPages = [
  "/users/add",
  "/users/edit",
  "/login"
];


  const isFullBg = fullBgPages.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <div className="layout-container">
      <Navbar />
      <div className={`page-content ${isFullBg ? "full-bg" : ""}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
