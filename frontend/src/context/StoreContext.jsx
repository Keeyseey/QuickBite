import { createContext, useEffect, useState } from "react";
import axios from "axios";
import jwtDecode from "jwt-decode"; // correct import

export const StoreContext = createContext(null);

const StoreContextProvider = ({ children }) => {
  // safer initial states
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState({});
  const [foodList, setFoodList] = useState([]);
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const url = "https://quickbite-1-tes3.onrender.com";

  // Helper to produce a safe user object for the UI
  const normalizeUser = (u = {}) => {
    // Attempt to split name into first/last if explicit fields missing
    const nameParts = (u.name || "").trim().split(/\s+/);
    return {
      _id: u._id || u.id || "",
      name: u.name || "",
      firstName: u.firstName || nameParts[0] || "",
      lastName: u.lastName || nameParts.slice(1).join(" ") || "",
      email: u.email || "",
      phone: u.phone || "",
      profileImage: u.profileImage || "",
      cartData: u.cartData || {},
      // savedAddress and currentLocation always exist (safe shape)
      savedAddress: {
        firstName: u.savedAddress?.firstName || u.firstName || nameParts[0] || "",
        lastName: u.savedAddress?.lastName || u.lastName || nameParts.slice(1).join(" ") || "",
        email: u.savedAddress?.email || u.email || "",
        street: u.savedAddress?.street || "",
        barangay: u.savedAddress?.barangay || "",
        purok: u.savedAddress?.purok || "",
        city: u.savedAddress?.city || "",
        state: u.savedAddress?.state || "",
        zipcode: u.savedAddress?.zipcode || "",
        country: u.savedAddress?.country || "",
        phone: u.savedAddress?.phone || u.phone || ""
      },
      currentLocation: {
        lat: (u.currentLocation && typeof u.currentLocation.lat === "number") ? u.currentLocation.lat : null,
        lng: (u.currentLocation && typeof u.currentLocation.lng === "number") ? u.currentLocation.lng : null
      },
      hasUsedPromo: !!u.hasUsedPromo,
      lastPromoCode: u.lastPromoCode || "",
      lastDiscount: u.lastDiscount || 0
    };
  };

  // Fetch food list
  const fetchFoodList = async () => {
    try {
      const res = await axios.get(`${url}/api/food/list`);
      setFoodList(res.data.data || []);
    } catch (err) {
      console.error("Fetch food list error:", err);
    }
  };

  // Load cart data (server-side cart)
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

  // Fetch user profile and normalize it
  const fetchUserProfile = async (activeToken) => {
    if (!activeToken) return null;
    try {
      const res = await axios.get(`${url}/api/user/profile`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.data.success && res.data.data) {
        const normalized = normalizeUser(res.data.data);
        setUser(normalized);
        // also set cartItems from fetched profile (single source of truth)
        setCartItems(normalized.cartData || {});
        return normalized;
      }
    } catch (err) {
      console.error("Fetch user profile error:", err);
      setUser(null);
      setCartItems({});
      return null;
    }
    return null;
  };

  // Init effect
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await fetchFoodList();

      const storedToken = localStorage.getItem("userToken");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(storedToken);
        const now = Date.now() / 1000;
        // handle expired tokens gracefully
        if (decoded.exp && decoded.exp < now) {
          console.warn("User token expired");
          localStorage.removeItem("userToken");
          setToken("");
          setRole("");
          setUserId("");
          setUser(null);
          setCartItems({});
        } else {
          setToken(storedToken);
          setRole(decoded.role || "user");
          // prefer _id if present
          setUserId(decoded._id || decoded.id || decoded.userId || "");

          // Fetch profile and take cart from that result if available
          const fetched = await fetchUserProfile(storedToken);
          // If fetchUserProfile didn't set cartData (some server setups), fallback to separate cart call
          const hasCartFromProfile = fetched && Object.keys(fetched.cartData || {}).length > 0;
          if (!hasCartFromProfile) {
            await loadCartData(storedToken);
          }
        }
      } catch (err) {
        console.error("Invalid user token:", err);
        localStorage.removeItem("userToken");
        setToken("");
        setRole("");
        setUserId("");
        setUser(null);
        setCartItems({});
      }

      setLoading(false);
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cart functions
  const addToCart = async (pid) => {
    if (!token) {
      alert("Please log in to add items to cart.");
      return;
    }

    try {
      const res = await axios.post(
        `${url}/api/cart/add`,
        { pid },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setCartItems(res.data.cartData || {});
      } else {
        alert("Failed to add to cart. Try logging in again.");
      }
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Failed to add to cart. Try logging in again.");
    }
  };

  const removeFromCart = async (pid) => {
    if (!token) return;

    try {
      const res = await axios.post(
        `${url}/api/cart/remove`,
        { pid },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setCartItems(res.data.cartData || {});
      }
    } catch (err) {
      console.error("Remove from cart error:", err);
    }
  };

  const getTotalCartAmount = () => {
    return Object.keys(cartItems).reduce((total, foodId) => {
      const itemInfo = foodList.find((f) => f._id === foodId);
      if (itemInfo) total += itemInfo.price * cartItems[foodId];
      return total;
    }, 0);
  };

  // Promo code (server should ideally use token to mark promo used)
  const applyPromoCode = async (code) => {
    if (!token) return { success: false };

    const normalizedCode = code.toUpperCase().trim();
    const promoCodes = { SAVE10: 0.1, SAVE20: 0.2, FREESHIP: 2 };

    if (!promoCodes[normalizedCode]) {
      setPromoCode("");
      setDiscount(0);
      return { success: false };
    }

    const amt =
      normalizedCode === "FREESHIP"
        ? 2
        : getTotalCartAmount() * promoCodes[normalizedCode];
    setPromoCode(normalizedCode);
    setDiscount(amt);

    try {
      // server should identify user from token; sending userId is optional
      await axios.put(
        `${url}/api/user/use-promo`,
        { promoCode: normalizedCode, discount: amt, userId: userId || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Error saving promo:", err);
    }

    return { success: true, amountSaved: amt };
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        setUser,
        cartItems,
        setCartItems,
        foodList,
        token,
        setToken,
        role,
        setRole,
        userId,
        url,
        loading,
        getTotalCartAmount,
        loadCartData,
        promoCode,
        discount,
        setPromoCode,
        setDiscount,
        applyPromoCode,
        addToCart,
        removeFromCart,
        isLoggedIn: !!token,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
