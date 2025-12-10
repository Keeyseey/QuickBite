import React, { useContext, useState } from "react";
import { AdminContext } from "../../context/AdminContext";
import axios from "axios";
import { assets } from "../../assets/assets";
import "./AdminLogin.css";

const AdminLogin = ({ setShowLogin }) => {
  const { loginAdmin } = useContext(AdminContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${url}/api/admin/login`, { email, password });

      // Check role
      if (res.data.role !== "admin") {
        setError("This account is not an admin.");
        setLoading(false);
        return;
      }

      // Save token in context and close popup
      loginAdmin(res.data.token);
      setShowLogin(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-popup">
      <div className="login-popup-container">
        <div className="login-popup-title">
          <h2>Admin Login</h2>
          <img
            src={assets.close_icon}
            alt="close"
            onClick={() => setShowLogin(false)}
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
        {error && <p style={{ color: "tomato", fontSize: "13px" }}>{error}</p>}
        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
