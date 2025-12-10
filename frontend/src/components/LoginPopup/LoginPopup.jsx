import React, { useState, useContext } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { RiderContext } from "../../context/RiderContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const LoginPopup = ({ setShowLogin, onRiderLoginSuccess }) => {
  const { url, setToken: setUserToken, setRole: setUserRole } = useContext(StoreContext);
  const { setToken: setRiderToken, setRole: setRiderRole } = useContext(RiderContext);
  const navigate = useNavigate();

  // Detect if User App is being viewed by Admin (Preview Mode)
  const isPreview =
    new URLSearchParams(window.location.search).get("preview") === "true";

  const [mode, setMode] = useState("Login");
  const [accountType, setAccountType] = useState("user");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isPreview) {
      alert("Login is disabled in preview mode for security and user privacy.");
      return; // 🚫 BLOCK LOGIN REQUESTS
    }

    try {
      let response;
      const normalizedEmail = formData.email.trim().toLowerCase();

      if (mode === "Login") {
        if (accountType === "rider") {
          response = await axios.post(`${url}/api/rider/auth/login`, {
            email: normalizedEmail,
            password: formData.password,
          });
        } else {
          response = await axios.post(`${url}/api/user/login`, {
            email: normalizedEmail,
            password: formData.password,
          });
        }
      } else {
        response = await axios.post(`${url}/api/user/register`, {
          ...formData,
          email: normalizedEmail,
        });
      }

      if (!response.data.success) {
        alert(response.data.message);
        return;
      }

      const token = response.data.token;

      let decoded;
      try {
        decoded = jwtDecode(token);
      } catch (err) {
        console.error("JWT decode error:", err);
        alert("Invalid token received from server.");
        return;
      }

      const role = decoded.role;

      setShowLogin(false);

      if (role === "rider") {
        localStorage.setItem("riderToken", token);
        setRiderToken(token);
        setRiderRole("rider");

        sessionStorage.setItem("showRiderWelcome", "true");

        if (onRiderLoginSuccess) onRiderLoginSuccess();
      } else {
        localStorage.setItem("userToken", token);
        setUserToken(token);
        setUserRole("user");
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err.response ? err.response.data : err);
      alert(err.response?.data?.message || "Invalid email or password.");
    }
  };

  const getTitle = () => {
    if (mode === "Sign Up") return "Sign Up";
    return accountType === "rider" ? "Login as Rider" : "Login as User";
  };

  return (
    <div className="login-popup">
      <form onSubmit={handleSubmit} className="login-popup-container">
        
        {/* PREVIEW MODE BANNER */}
        {isPreview && (
          <div style={{
            padding: "10px",
            background: "#ffdddd",
            color: "#b30000",
            textAlign: "center",
            borderRadius: "8px",
            marginBottom: "10px",
            fontWeight: "bold",
          }}>
            🔒 Login disabled — Preview Mode only.  
            Admin cannot access user/rider accounts.
          </div>
        )}

        {/* Account Type */}
        <div className="login-popup-type-buttons">
          <button
            type="button"
            className={accountType === "user" ? "active" : ""}
            disabled={isPreview}   // 🚫 disable switching in preview
            onClick={() => { setAccountType("user"); setMode("Login"); }}
          >
            User
          </button>
          <button
            type="button"
            className={accountType === "rider" ? "active" : ""}
            disabled={isPreview}   // 🚫 disable switching in preview
            onClick={() => { setAccountType("rider"); setMode("Login"); }}
          >
            Rider
          </button>
        </div>

        {/* Title & Close */}
        <div className="login-popup-title">
          <h2>{getTitle()}</h2>
          <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="Close" />
        </div>

        {/* Input Fields */}
        <div className="login-popup-inputs">
          {mode === "Sign Up" && !isPreview && (
            <input
              name="name"
              type="text"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          )}

          <input
            name="email"
            type="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isPreview} // 🔒 email input locked
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isPreview} // 🔒 password input locked
          />
        </div>

        <button type="submit" disabled={isPreview}>
          {mode === "Sign Up" ? "Create Account" : "Login"}
        </button>

        <div className="login-popup-condition">
          <input type="checkbox" required disabled={isPreview} />
          <p>By continuing, I agree to the terms of use & privacy policy.</p>
        </div>

        <p>
          {mode === "Login" ? "Create a new account? " : "Already have an account? "}
          <span
            onClick={() => !isPreview && setMode(mode === "Login" ? "Sign Up" : "Login")}
            style={{ cursor: isPreview ? "not-allowed" : "pointer", opacity: isPreview ? 0.4 : 1 }}
          >
            {mode === "Login" ? "Click Here" : "Login Here"}
          </span>
        </p>
      </form>
    </div>
  );
};

export default LoginPopup;
