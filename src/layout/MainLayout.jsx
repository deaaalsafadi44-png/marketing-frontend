import Navbar from "../components/Navbar";
import { Outlet, useLocation } from "react-router-dom";
import "./MainLayout.css";

const MainLayout = () => {
  const location = useLocation();

  const fullBgPages = ["/users/add"];

  const isFullBg = fullBgPages.includes(location.pathname);

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
