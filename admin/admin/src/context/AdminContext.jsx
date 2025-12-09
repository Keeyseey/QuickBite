import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { assets } from "../assets/assets";
import { jwtDecode } from "jwt-decode";

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [adminToken, setAdminToken] = useState(localStorage.getItem("adminToken") || "");
  const [adminProfile, setAdminProfileState] = useState({
    name: "Admin",
    email: "",
    phone: "", // added phone for controlled input
    profileImage: assets.profile_image,
  });
  const [loading, setLoading] = useState(true);

  const url = "https://quickbite-1-tes3.onrender.com"; // backend URL

  // ---------------- LOGIN ----------------
  const loginAdmin = async (token) => {
    localStorage.setItem("adminToken", token);
    setAdminToken(token);

    // Fetch profile immediately after login
    await fetchAdminProfile(token);
  };

  // ---------------- LOGOUT ----------------
  const logoutAdmin = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminProfile");
    setAdminToken("");
    setAdminProfileState({
      name: "Admin",
      email: "",
      phone: "",
      profileImage: assets.profile_image,
    });
  };

  // ---------------- SET PROFILE ----------------
  const setAdminProfile = (newProfile) => {
    const safeProfile = {
      name: newProfile.name || "",
      email: newProfile.email || "",
      phone: newProfile.phone || "",
      profileImage: newProfile.profileImage || assets.profile_image,
    };
    setAdminProfileState(safeProfile);
    localStorage.setItem("adminProfile", JSON.stringify(safeProfile));
  };

  // ---------------- FETCH PROFILE ----------------
  const fetchAdminProfile = async (token) => {
    if (!token) return;

    try {
      const res = await axios.get(`${url}/api/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success && res.data.data) {
        const profileData = {
          name: res.data.data.name || "",
          email: res.data.data.email || "",
          phone: res.data.data.phone || "",
          profileImage: res.data.data.profileImage
            ? `${url}${res.data.data.profileImage}`
            : assets.profile_image,
        };
        setAdminProfile(profileData);
      }
    } catch (err) {
      console.error("Error fetching admin profile:", err);
      logoutAdmin();
    }
  };

  // ---------------- INITIAL LOAD ----------------
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      // Load profile from localStorage first for instant display
      const storedProfile = localStorage.getItem("adminProfile");
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        setAdminProfile({
          name: parsed.name,
          email: parsed.email,
          phone: parsed.phone || "",
          profileImage: parsed.profileImage || assets.profile_image,
        });
      }

      // Fetch fresh profile from backend if token exists
      if (adminToken) {
        try {
          const decoded = jwtDecode(adminToken);
          const now = Date.now() / 1000;

          if (decoded.exp && decoded.exp < now) {
            logoutAdmin(); // Token expired
          } else {
            await fetchAdminProfile(adminToken);
          }
        } catch (err) {
          console.error("Invalid admin token:", err);
          logoutAdmin();
        }
      }

      setLoading(false);
    };

    initialize();
  }, [adminToken]);

  // ---------------- RE-FETCH PROFILE WHEN TOKEN CHANGES ----------------
  useEffect(() => {
    if (adminToken) fetchAdminProfile(adminToken);
  }, [adminToken]);

  return (
    <AdminContext.Provider
      value={{
        adminToken,
        adminProfile,
        loginAdmin,
        logoutAdmin,
        setAdminProfile,
        fetchAdminProfile,
        loading,
        url, // ✅ added url so components can access backend base URL
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
