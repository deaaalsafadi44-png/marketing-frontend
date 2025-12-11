import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    // إذا كان هناك سجل تنقل داخل نفس التبويب
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      // إذا دخل مباشرة للصفحة → أعده لصفحة ثابتة
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
