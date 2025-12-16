import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    // 🔁 إعادة توجيه ذكية حسب الدور
    if (user?.role === "Admin") {
      navigate("/", { replace: true });
    } else {
      navigate("/tasks", { replace: true });
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "#222",
      }}
    >
      <h1 style={{ fontSize: "36px", color: "#d32f2f", marginBottom: "10px" }}>
        ❌ Access Denied
      </h1>

      <p style={{ fontSize: "18px", marginBottom: "20px" }}>
        You do not have permission to access this page.
      </p>

      <button
        onClick={handleGoBack}
        style={{
          padding: "10px 20px",
          backgroundColor: "#d32f2f",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        🔙 Go Back
      </button>
    </div>
  );
};

export default Unauthorized;
