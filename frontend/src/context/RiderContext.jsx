import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { assets } from "../assets/assets";

export const RiderContext = createContext(null);

const RiderContextProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState({});
  const [foodList, setFoodList] = useState([]);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  const [riderId, setRiderId] = useState(null);

  const [riderProfile, setRiderProfileState] = useState({
    name: "Rider",
    profileImage: assets.default_profile,
    phone: "",
  });

  const url = "http://localhost:4000";

  // ---------------- FOOD LIST ----------------
  const fetchFoodList = async () => {
    try {
      const res = await axios.get(`${url}/api/food/list`);
      setFoodList(res.data.data || []);
    } catch (err) {
      console.error("Fetch food list error:", err);
    }
  };

  // ---------------- CART DATA ----------------
  const loadCartData = async (activeToken) => {
    if (!activeToken) return;

    try {
      const res = await axios.post(
        `${url}/api/cart/get`,
        {},
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );

      setCartItems(res.data.cartData || {});
    } catch (err) {
      console.error("Load cart data error:", err);
      setCartItems({});
    }
  };

  // ---------------- LOGOUT RIDER ----------------
  const logoutRider = () => {
    localStorage.removeItem("riderToken");
    localStorage.removeItem("riderProfile");

    setToken(null);  // <-- THIS IS THE IMPORTANT PART
    setRole("");
    setRiderId(null);

    setRiderProfileState({
      name: "Rider",
      profileImage: assets.default_profile,
      phone: "",
    });
  };


  // ---------------- SAVE PROFILE ----------------
  const setRiderProfile = (newProfile) => {
    setRiderProfileState(newProfile);
    localStorage.setItem("riderProfile", JSON.stringify(newProfile));
  };

  // ---------------- FETCH RIDER PROFILE ----------------
  const fetchRiderProfile = async (activeToken) => {
    if (!activeToken) return;

    try {
      const res = await axios.get(`${url}/api/rider/profile`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      if (res.data.success && res.data.data) {
        const profileData = {
          name: res.data.data.name || "Rider",
          profileImage: res.data.data.profileImage
            ? `${url}${res.data.data.profileImage}`
            : assets.default_profile,
          phone: res.data.data.phone || "",
        };

        setRiderProfile(profileData);
      }
    } catch (err) {
      console.error("Error fetching rider profile:", err);
    }
  };

  // ---------------- INITIAL LOAD (ONE TIME) ----------------
  useEffect(() => {
    const initialize = async () => {
      await fetchFoodList();

      // load local profile for instant navbar display
      const storedProfile = localStorage.getItem("riderProfile");
      if (storedProfile) {
        setRiderProfileState(JSON.parse(storedProfile));
      }

      const storedToken = localStorage.getItem("riderToken");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(storedToken);
        const now = Date.now() / 1000;

        if (decoded.exp && decoded.exp < now) {
          localStorage.removeItem("riderToken");
          localStorage.removeItem("riderProfile");
          setToken(null);
        } else {
          setToken(storedToken);
          setRole(decoded.role || "rider");
          setRiderId(decoded.id || null);

          await fetchRiderProfile(storedToken);
          await loadCartData(storedToken);
        }
      } catch (err) {
        console.error("Invalid rider token:", err);
        localStorage.removeItem("riderToken");
        localStorage.removeItem("riderProfile");
        setToken(null);
      }

      setLoading(false);
    };

    initialize();
  }, []);

  // -------------------------------------------------------
  // ⭐ NEW FIX: Re-run profile fetch whenever TOKEN CHANGES
  // -------------------------------------------------------
  useEffect(() => {
    if (!token) return;
    fetchRiderProfile(token);
    loadCartData(token);
  }, [token]);

  return (
    <RiderContext.Provider
      value={{
        cartItems,
        setCartItems,
        foodList,
        token,
        setToken,
        role,
        setRole,
        url,
        loading,
        loadCartData,
        isLoggedIn: !!token,
        riderId,
        riderProfile,
        setRiderProfile,
        logoutRider,
      }}
    >
      {children}
    </RiderContext.Provider>
  );
};

export default RiderContextProvider;
