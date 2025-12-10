import React, { useState, useContext, useEffect } from "react";
import "./RiderWelcome.css";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import RiderLogin from "./RiderLogin";
import { RiderContext } from "../../context/RiderContext";

const RiderWelcome = () => {
  const { token } = useContext(RiderContext);
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);

  // If no token, always hide login popup on load
  useEffect(() => {
    if (!token) setShowLogin(false);
  }, [token]);

  return (
    <div className="rider-welcome-container">
      <div className="welcome-card">
        <img src={assets.rider_logo} className="welcome-logo" alt="Rider Logo" />
        <h1 className="welcome-title">Welcome, Rider!</h1>

        {token ? (
          <>
            <p className="welcome-text">
              You are logged in. Ready to manage deliveries?
            </p>
            <button
              className="welcome-btn"
              onClick={() => navigate("/rider-dashboard")}
            >
              Go to Dashboard
            </button>
          </>
        ) : (
          <>
            <p className="welcome-text">
              Please sign in to access your rider panel.
            </p>
            <button
              className="welcome-btn"
              onClick={() => setShowLogin(true)}
            >
              Sign In
            </button>
          </>
        )}
      </div>

      {showLogin && (
        <RiderLogin onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
};

export default RiderWelcome;
