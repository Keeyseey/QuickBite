import React, { useContext, useState } from "react";
import { RiderContext } from "../../context/RiderContext";
import axios from "axios";
import { assets } from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import "./RiderLogin.css";

const RiderLogin = ({ onClose }) => {
  const { url, setToken, setRole } = useContext(RiderContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🚫 FULL LOGOUT + Redirect when closing popup
  const handleClosePopup = () => {
    localStorage.removeItem("riderToken");
    setToken(null);
    setRole(null);

    // Replace history so back button cannot return to dashboard
    navigate("/rider-welcome", { replace: true });

    onClose();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${url}/api/rider/auth/login`, {
        email,
        password,
      });

      if (!res.data.success) {
        setError(res.data.message || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("riderToken", res.data.token);
      setToken(res.data.token);
      setRole("rider");

      sessionStorage.setItem("showRiderWelcome", "true");

      onClose(); // close login popup 
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-popup">
      <div className="login-popup-container">
        <div className="login-popup-title">
          <h2>Rider Login</h2>
          <img
            src={assets.cross_icon}
            alt="close"
            onClick={handleClosePopup}  // <-- Updated
          />
        </div>

        <div className="login-popup-inputs">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
};

export default RiderLogin;
