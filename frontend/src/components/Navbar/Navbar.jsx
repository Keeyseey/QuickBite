import React, { useContext, useState, useEffect } from 'react';
import './Navbar.css';
import { assets } from '../../assets/assets';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';

const Navbar = ({ setShowLogin, reviewMode = false }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // ----------------------
  // Hooks
  // ----------------------
  const [menu, setMenu] = useState("home");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profileImage, setProfileImage] = useState(assets.profile_icon);

  const { getTotalCartAmount, token, setToken, role, setRole, url } = useContext(StoreContext);

  // ----------------------
  // Fetch updated profile
  // ----------------------
  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${url}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        const fullImage = data.profileImage ? `${url}${data.profileImage}` : assets.profile_icon;
        setProfileImage(fullImage);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err.response?.data || err);
      setProfileImage(assets.profile_icon);
    }
  };

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  // ----------------------
  // Logout
  // ----------------------
  const logout = () => {
    if (reviewMode) return;
    localStorage.removeItem("userToken");
    localStorage.removeItem("riderToken");
    setToken("");
    setRole("");
    navigate("/");
  };

  // ----------------------
  // Autocomplete / Search Suggestions
  // ----------------------
  useEffect(() => {
    if (!searchQuery || reviewMode) return setSuggestions([]);
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/food/search?query=${searchQuery}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        } else setSuggestions([]);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [searchQuery, reviewMode]);

  const handleSelectSuggestion = (foodName) => {
    if (reviewMode) return;
    setSearchQuery(foodName);
    setSuggestions([]);
    navigate(`/search?query=${foodName}`);
    setShowSearch(false);
  };

  const handleSearch = async () => {
    if (reviewMode) {
      alert("Search disabled in Preview Mode.");
      return;
    }
    if (!searchQuery) return;
    try {
      const response = await fetch(`http://localhost:4000/api/food/search?query=${searchQuery}`);
      if (response.status === 404) alert("Food not available");
      else navigate(`/search?query=${searchQuery}`);
    } catch (error) {
      console.error("Search error:", error);
      alert("Something went wrong while searching");
    }
    setShowSearch(false);
  };

  // ----------------------
  // Close dropdown on outside click
  // ----------------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.navbar-profile')) setShowDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ----------------------
  // Conditional render: hide navbar on rider welcome
  // ----------------------
  if (location.pathname === "/rider-welcome") return null;

  // ----------------------
  // JSX
  // ----------------------
  return (
    <div className='navbar'>
      <Link to='/'><img src={assets.logo} alt="logo" className="logo" /></Link>

      <ul className="navbar-menu">
        <Link to='/' onClick={() => setMenu("home")} className={menu === "home" ? "active" : ""}>home</Link>
        <a href='#explore-menu' onClick={() => setMenu("menu")} className={menu === "menu" ? "active" : ""}>menu</a>
        <a href='#app-download' onClick={() => setMenu("mobile-app")} className={menu === "mobile-app" ? "active" : ""}>mobile-app</a>
        <a href='#footer' onClick={() => setMenu("contact-us")} className={menu === "contact-us" ? "active" : ""}>contact us</a>
      </ul>

      <div className="navbar-right">
        <img
          src={assets.search_icon}
          alt="search"
          className="search-icon"
          onClick={() => !reviewMode && setShowSearch(true)}
          style={{ cursor: reviewMode ? "not-allowed" : "pointer", opacity: reviewMode ? 0.5 : 1 }}
        />

        {role === "user" && !reviewMode && (
          <div className="navbar-search-icon">
            <Link to='/cart'><img src={assets.basket_icon} alt="cart" /></Link>
            <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
          </div>
        )}

        {!token ? (
          <button
            onClick={() => !reviewMode && setShowLogin(true)}
            disabled={reviewMode}
            style={{ cursor: reviewMode ? "not-allowed" : "pointer", opacity: reviewMode ? 0.5 : 1 }}
          >
            Sign In
          </button>
        ) : (
          <div
            className='navbar-profile'
            onClick={() => !reviewMode && setShowDropdown(prev => !prev)}
            style={{ cursor: reviewMode ? "not-allowed" : "pointer" }}
          >
            <img src={profileImage} alt="profile" />
            {showDropdown && (
              <ul className='navbar-profile-dropdown'>
                {reviewMode ? (
                  <li style={{ color: "#b30000", cursor: "not-allowed", textAlign: "center" }}>
                    ⚠ Preview Mode — actions disabled
                  </li>
                ) : (
                  <>
                    {role === "user" && (
                      <>
                        <li onClick={() => navigate('/profile')}>
                          <img src={profileImage} alt="profile" />
                          <p>See Profile</p>
                        </li>
                        <li onClick={() => navigate('/myorders')}>
                          <img src={assets.bag_icon} alt="orders" />
                          <p>Orders</p>
                        </li>
                      </>
                    )}
                    {role === "rider" && (
                      <li onClick={() => navigate('/rider-dashboard')}>
                        <img src={assets.bag_icon} alt="dashboard" />
                        <p>Rider Dashboard</p>
                      </li>
                    )}
                    <hr />
                    <li onClick={logout}>
                      <img src={assets.logout_icon} alt="logout" />
                      <p>Logout</p>
                    </li>
                  </>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {showSearch && (
        <div className="search-overlay">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search food..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              disabled={reviewMode}
            />
            <button onClick={handleSearch} disabled={reviewMode}>Search</button>
            <button className="close-btn" onClick={() => setShowSearch(false)}>✕</button>

            {suggestions.length > 0 && !reviewMode && (
              <ul className="suggestions-list">
                {suggestions.map((food) => (
                  <li key={food._id} onClick={() => handleSelectSuggestion(food.name)}>
                    {food.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {reviewMode && (
        <div style={{
          position: "absolute",
          top: "60px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#ffdddd",
          color: "#b30000",
          padding: "5px 15px",
          borderRadius: "5px",
          fontWeight: "bold",
          zIndex: 1000
        }}>
          🔒 Preview Mode Active — actions are disabled
        </div>
      )}
    </div>
  );
};

export default Navbar;
