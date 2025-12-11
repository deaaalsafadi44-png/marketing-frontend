import { useEffect, useState } from "react";

const Toast = ({ message, duration = 2500 }) => {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;

    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        background: "#ff3333",
        padding: "14px 24px",
        borderRadius: "10px",
        color: "white",
        fontWeight: "600",
        fontSize: "15px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
        zIndex: 9999,
        display: "flex",
        gap: "10px",
        alignItems: "center",
        animation: "toast-slide-in 0.3s ease-out",
      }}
    >
      <span>⚠️</span> {message}

      <style>
        {`
          @keyframes toast-slide-in {
            from {
              opacity: 0;
              transform: translateX(40px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes toast-slide-out {
            from {
              opacity: 1;
              transform: translateX(0);
            }
            to {
              opacity: 0;
              transform: translateX(40px);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Toast;
