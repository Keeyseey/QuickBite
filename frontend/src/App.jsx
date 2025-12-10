import React, { useState, useContext, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import RiderNavbar from "./components/Navbar/RiderNavbar";

import Home from "./pages/Home/Home";
import Cart from "./pages/Home/Cart/Cart";
import PlaceOrder from "./pages/Home/Cart/PlaceOrder/PlaceOrder";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import Verify from "./pages/Verify/Verify";
import MyOrders from "./pages/MyOrders/MyOrders";
import SearchResults from "./components/SearchResults/SearchResults";
import UserProfile from "./pages/UserProfile/UserProfile";

import RiderDashboard from "./pages/Rider/RiderDashboard";
import RiderWelcome from "./pages/Rider/RiderWelcome";
import RiderProfile from "./pages/Rider/RiderProfile";
import PrivateRiderRoute from "./pages/Rider/PrivateRiderRoute";
import RiderLogin from "./pages/Rider/RiderLogin";

import "leaflet/dist/leaflet.css";
import "./fixLeaflet";

import StoreContextProvider, { StoreContext } from "./context/StoreContext";
import RiderContextProvider, { RiderContext } from "./context/RiderContext";

const AppRoutes = () => {
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Rider first
  const { role: riderRole, loading: riderLoading } = useContext(RiderContext);
  const { role: userRole, loading: userLoading } = useContext(StoreContext);

  const loading = riderLoading || userLoading;

  // Choose role (rider > user)
  const role = riderRole ? "rider" : userRole ? "user" : null;

  // Rider welcome redirect
  useEffect(() => {
    if (!loading && role === "rider") {
      const show = sessionStorage.getItem("showRiderWelcome");
      if (show === "true") {
        navigate("/rider-welcome", { replace: true });
        sessionStorage.removeItem("showRiderWelcome");
      }
    }
  }, [loading, role, navigate]);

  if (loading) return <div>Loading...</div>;

  // Hide navbar on Rider Welcome page
  const showNavbar =
    !(role === "rider" && location.pathname === "/rider-welcome");

  return (
    <>
      {showLogin && (
        <LoginPopup
          setShowLogin={setShowLogin}
          onRiderLoginSuccess={() =>
            sessionStorage.setItem("showRiderWelcome", "true")
          }
        />
      )}

      {/* Correctly rendered Navbar */}
      {showNavbar && (
        role === "rider" ? (
          <RiderNavbar />
        ) : role === "user" ? (
          <Navbar setShowLogin={setShowLogin} />
        ) : null
      )}

      <div className="app">
        <Routes>
          {/* HOME */}
          <Route
            path="/"
            element={
              role === "rider" ? (
                <Navigate to="/rider-dashboard" replace />
              ) : (
                <Home />
              )
            }
          />

          {/* USER ROUTES */}
          {role === "user" && (
            <>
              <Route path="/cart" element={<Cart />} />
              <Route path="/order" element={<PlaceOrder />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/myorders" element={<MyOrders />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/profile" element={<UserProfile />} />
            </>
          )}

          {/* RIDER LOGIN */}
          <Route
            path="/rider-login"
            element={
              <RiderLogin
                onLoginSuccess={() =>
                  sessionStorage.setItem("showRiderWelcome", "true")
                }
              />
            }
          />

          {/* Rider welcome */}
          <Route path="/rider-welcome" element={<RiderWelcome />} />

          {/* RIDER PRIVATE */}
          {role === "rider" && (
            <>
              <Route
                path="/rider-dashboard"
                element={
                  <PrivateRiderRoute>
                    <RiderDashboard />
                  </PrivateRiderRoute>
                }
              />
              <Route
                path="/rider/profile"
                element={
                  <PrivateRiderRoute>
                    <RiderProfile />
                  </PrivateRiderRoute>
                }
              />
            </>
          )}

          {/* 404 */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </div>

      {/* FOOTER ONLY FOR USERS */}
      {role === "user" && <Footer />}
    </>
  );
};

const App = () => {
  // FIX: Rider must wrap StoreContext so rider loads FIRST
  return (
    <RiderContextProvider>
      <StoreContextProvider>
        <AppRoutes />
      </StoreContextProvider>
    </RiderContextProvider>
  );
};

export default App;
