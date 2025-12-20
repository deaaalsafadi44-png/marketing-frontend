import "./login.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👁️
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("❌ Invalid email or password");
      } else {
        setError("❌ Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleLogin}>
        <h2>Login</h2>

        {error && <p className="error-text">{error}</p>}

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          required
        />

        {/* Password with eye */}
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            required
          />

          <span
            className="toggle-pass"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* Button + Spinner */}
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? <span className="spinner"></span> : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
