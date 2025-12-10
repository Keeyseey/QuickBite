import React, { useContext, useState, useEffect, useRef } from "react";
import "./RiderNavbar.css";
import { assets } from "../../assets/assets";
import { RiderContext } from "../../context/RiderContext";
import { useNavigate } from "react-router-dom";

const RiderNavbar = () => {
  const { token, loading, riderProfile, setRiderProfile } = useContext(RiderContext);
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // On mount: load rider profile from localStorage if context is empty
  useEffect(() => {
    if (!riderProfile?.name || !riderProfile?.profileImage) {
      const storedProfile = localStorage.getItem("riderProfile");
      if (storedProfile) {
        setRiderProfile(JSON.parse(storedProfile));
      }
    }
  }, [riderProfile, setRiderProfile]);

  // Logout handler
  const handleLogout = () => {
    // Keep your code intact
    localStorage.removeItem("riderToken");
    localStorage.removeItem("riderProfile");

    setRiderProfile({
      name: "Rider",
      profileImage: assets.default_profile,
      phone: "",
    });

    // ✅ Force reload so RiderWelcome sees no token
    navigate("/rider-welcome", { replace: true });
    setTimeout(() => {
      window.location.reload(); // ensures context updates and welcome page renders properly
    }, 50);

    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navbar shouldn't display while loading or without token
  if (loading || !token) return null;

  const profileImage = riderProfile?.profileImage || assets.default_profile;
  const profileName = riderProfile?.name || "Rider";

  return (
    <div className="navbar">
      <img
        className="logo"
        src={assets.rider_logo}
        alt="Logo"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/rider-dashboard")}
      />

      <div className="navbar-right">
        <div
          className="navbar-profile"
          ref={dropdownRef}
          onClick={() => setShowDropdown((prev) => !prev)}
        >
          <img
            className="profile"
            src={profileImage}
            alt={profileName}
            onError={(e) => (e.target.src = assets.default_profile)}
          />

          {showDropdown && (
            <ul className="navbar-profile-dropdown">
              <li onClick={() => navigate("/rider/profile")}>
                <img src={assets.profile_icon} alt="Profile" />
                <p>See Profile</p>
              </li>

              <li onClick={handleLogout}>
                <img src={assets.logout_icon} alt="Logout" />
                <p>Logout</p>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiderNavbar;
