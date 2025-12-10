import React, { useState, useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import Add from './pages/Add/Add';
import List from './pages/List/List';
import Orders from './pages/Orders/Orders';
import AddRider from './pages/AddRider/AddRider';
import RiderList from './pages/RiderList/RiderList';
import UserAppReview from './pages/UserAppReview/UserAppReview';
import AdminLogin from './pages/Login/AdminLogin';
import WelcomePage from './pages/WelcomePage/WelcomePage';
import AdminProfile from './pages/AdminProfile/AdminProfile';
import { ToastContainer } from 'react-toastify';
import { AdminContext } from './context/AdminContext';

// Protected route component
const PrivateAdminRoute = ({ children }) => {
  const { adminToken } = useContext(AdminContext);
  if (!adminToken) return <Navigate to="/" />;
  return children;
};

const App = () => {
  const url = "http://localhost:4000";
  const [showLogin, setShowLogin] = useState(false);
  const { adminToken } = useContext(AdminContext);

  const location = useLocation(); // Get current route
  const hideSidebar = location.pathname === "/admin/profile"; // Hide sidebar on profile page

  return (
    <div className="app-wrapper">
      <ToastContainer />

      <Navbar
        showSignIn={!adminToken}
        onSignInClick={() => setShowLogin(true)}
      />
      <hr />

      <div className="app-content" style={{ display: 'flex' }}>
        {/* Sidebar only visible when admin is logged in AND not on profile page */}
        {adminToken && !hideSidebar && <Sidebar />}

        <div style={{ flex: 1, width: '100%' }}>
          {showLogin && !adminToken && (
            <AdminLogin setShowLogin={setShowLogin} />
          )}

          <Routes>
            <Route
              path="/"
              element={
                !adminToken ? (
                  <WelcomePage onSignInClick={() => setShowLogin(true)} />
                ) : (
                  <Navigate to="/add" />
                )
              }
            />

            <Route path="/add" element={<PrivateAdminRoute><Add url={url} /></PrivateAdminRoute>} />
            <Route path="/list" element={<PrivateAdminRoute><List url={url} /></PrivateAdminRoute>} />
            <Route path="/orders" element={<PrivateAdminRoute><Orders url={url} /></PrivateAdminRoute>} />
            <Route path="/add-rider" element={<PrivateAdminRoute><AddRider url={url} /></PrivateAdminRoute>} />
            <Route path="/rider-list" element={<PrivateAdminRoute><RiderList url={url} /></PrivateAdminRoute>} />
            <Route path="/review-user-app" element={<PrivateAdminRoute><UserAppReview /></PrivateAdminRoute>} />

            <Route path="/admin/profile" element={<PrivateAdminRoute><AdminProfile /></PrivateAdminRoute>} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
