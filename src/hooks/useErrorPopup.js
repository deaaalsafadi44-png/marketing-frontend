import { useState } from "react";

export default function useErrorPopup() {
  const [error, setError] = useState("");

  const showError = (msg) => {
    setError(msg);

    setTimeout(() => {
      setError("");
    }, 2500);
  };

  const ErrorBox = () =>
    error ? (
      <div
        style={{
          background: "#ff5252",
          padding: "10px",
          color: "white",
          borderRadius: "6px",
          marginBottom: "15px",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        {error}
      </div>
    ) : null;

  return { showError, ErrorBox };
}
