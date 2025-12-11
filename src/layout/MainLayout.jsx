import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import "./MainLayout.css";

const MainLayout = () => {
  return (
    <div className="layout-container">
      <Navbar />
      <div className="page-content">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
