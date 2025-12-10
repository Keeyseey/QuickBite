import React, { useContext, useState, useEffect, useRef } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { AdminContext } from "../../context/AdminContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { adminToken, adminProfile, logoutAdmin } = useContext(AdminContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logoutAdmin();
    setDropdownOpen(false);
    navigate("/"); // back to welcome page
  };

  const handleSeeProfile = () => {
    setDropdownOpen(false);
    navigate("/admin/profile"); // redirect to AdminProfile page
  };

  const handleLogoClick = () => {
    navigate("/add"); // Redirect to admin panel main page
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide navbar completely if admin is not logged in
  if (!adminToken) return null;

  return (
    <div className="navbar">
      <img
        className="logo"
        src={assets.logo}
        alt="Logo"
        onClick={handleLogoClick} // <-- added
        style={{ cursor: "pointer" }}
      />

      <div className="navbar-right">
        <div
          className="navbar-profile"
          onClick={() => setDropdownOpen((prev) => !prev)}
          ref={dropdownRef}
        >
          <img
            className="profile"
            src={adminProfile?.profileImage || assets.profile_image}
            alt={adminProfile?.name || "Admin"}
            onError={(e) => (e.target.src = assets.profile_image)}
          />

          <ul className={`navbar-profile-dropdown ${dropdownOpen ? "show" : ""}`}>
            <li onClick={handleSeeProfile}>
              <img src={assets.profile_icon} alt="Profile" />
              <p>See Profile</p>
            </li>
            <li onClick={handleLogout}>
              <img src={assets.logout_icon} alt="Logout" />
              <p>Logout</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
