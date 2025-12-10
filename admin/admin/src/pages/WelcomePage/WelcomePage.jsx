import React from "react";
import "./WelcomePage.css";
import { assets } from "../../assets/assets"; // import your assets

const WelcomePage = ({ onSignInClick }) => {
  return (
    <div className="welcome-page">
      {/* Welcome logo */}
      <img className="welcome-logo" src={assets.welcome_logo} alt="Welcome Logo" />

      <h1>Welcome, Admin!</h1>
      <p>Please sign in to access the admin panel.</p>
      <button className="sign-in-btn" onClick={onSignInClick}>
        Sign In
      </button>
    </div>
  );
};

export default WelcomePage;
