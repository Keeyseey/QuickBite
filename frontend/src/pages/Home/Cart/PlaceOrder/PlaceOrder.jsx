import React, { useContext, useEffect, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../../../context/StoreContext';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import PickLocationMap from "../../../../components/PickLocationMap/PickLocationMap";

const LOCATIONIQ_API_KEY = process.env.REACT_APP_LOCATIONIQ_API_KEY;

const PlaceOrder = () => {
  const {
    getTotalCartAmount,
    token,
    foodList = [],
    cartItems = {},
    url,
    user = {},
    discount = 0,
    promoCode = null
  } = useContext(StoreContext);

  const navigate = useNavigate();

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    barangay: "",
    purok: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: ""
  });

  const [distance, setDistance] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false); // ✅ Prevent auto order

  const restaurantLocation = { lat: 9.78712415, lng: 125.494369721199 };

  // -----------------------
  // Distance calculation
  // -----------------------
  const getDistanceInKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const calculateDeliveryFee = (dist) => {
    if (getTotalCartAmount() === 0) return 0;
  
    // Fix floating-point bug
    const d = Number(dist.toFixed(2));
  
    if (d <= 0.5) return 10;
    if (d <= 1) return 15;
    if (d <= 2) return 25;
    if (d <= 3) return 35;
    if (d <= 5) return 50;
  
    return 60; // max cap
  };

  // -----------------------
  // Location functions
  // -----------------------
  const handlePinLocation = async (lat, lng) => {
    if (isSaved) return;

    setPinnedLocation({ lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });

    await fetchAddressFromCoords(lat, lng);

    const dist = getDistanceInKm(lat, lng, restaurantLocation.lat, restaurantLocation.lng);
    setDistance(dist);
    setDeliveryFee(calculateDeliveryFee(dist));

    setCanSubmit(true); // ✅ Allow order after location is pinned
  };

  const fetchAddressFromCoords = async (lat, lng) => {
    try {
      const response = await axios.get("https://us1.locationiq.com/v1/reverse.php", {
        params: { key: LOCATIONIQ_API_KEY, lat, lon: lng, format: "json" }
      });

      const addr = response.data.address || {};

      setData(prev => ({
        ...prev,
        street: addr.road || "",
        barangay: addr.suburb || "",
        purok: "",
        city: addr.city || addr.town || addr.village || "",
        state: addr.state || "",
        country: addr.country || "",
        zipcode: addr.postcode || ""
      }));
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  const useMyLocation = () => {
    if (isSaved) return;
    if (!navigator.geolocation) return alert("Geolocation not supported.");

    navigator.geolocation.getCurrentPosition(
      pos => handlePinLocation(pos.coords.latitude, pos.coords.longitude),
      () => alert("Unable to get your location."),
      { enableHighAccuracy: true }
    );
  };

  // -----------------------
  // Save user delivery info
  // -----------------------
  const saveUserInfo = async () => {
    if (!pinnedLocation) return alert("Pin your delivery location first.");

    try {
      const res = await axios.put(
        `${url}/api/user/save-delivery-info`,
        { data, pinnedLocation },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setIsSaved(true);
        setCanSubmit(true); // ✅ Allow order after info is saved
        alert("Delivery information saved!");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save delivery info.");
    }
  };

  const editSavedInfo = () => {
    setIsSaved(false);
    setCanSubmit(false); // Prevent order until re-saved
    alert("You can now edit your delivery information.");
  };

  // -----------------------
  // Load saved delivery info
  // -----------------------
  useEffect(() => {
    if (!token) return;

    const fetchSavedInfo = async () => {
      try {
        const res = await axios.get(`${url}/api/user/delivery-info`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success && res.data.deliveryInfo) {
          const saved = res.data.deliveryInfo.data || {};
          setData(prev => ({ ...prev, ...saved }));

          const loc = res.data.deliveryInfo.pinnedLocation || null;
          setPinnedLocation(loc);
          setIsSaved(!!loc);
          setCanSubmit(!!loc); // ✅ Only allow order if location exists

          if (loc) {
            const dist = getDistanceInKm(loc.lat, loc.lng, restaurantLocation.lat, restaurantLocation.lng);
            setDistance(dist);
            setDeliveryFee(calculateDeliveryFee(dist));
          }
        }
      } catch (err) {
        console.error("Fetch saved info error:", err);
      }
    };

    fetchSavedInfo();
  }, [token]);

  // -----------------------
  // Place order
  // -----------------------
  const placeOrder = async (e) => {
    e.preventDefault();
    if (!canSubmit) return alert("Please pin your location and save your delivery info first.");

    if (!token) { alert("Login required."); navigate("/cart"); return; }
    if (!pinnedLocation || !pinnedLocation.lat || !pinnedLocation.lng) {
      return alert("Please pin your location first.");
    }

    const items = foodList
      .filter(item => cartItems[item._id] > 0)
      .map(item => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        quantity: cartItems[item._id]
      }));

    if (items.length === 0) { alert("Cart is empty."); navigate("/cart"); return; }

    const requiredFields = ["firstName","lastName","email","street","city","state","country","zipcode","phone"];
    for (let field of requiredFields) {
      if (!data[field] || data[field].trim() === "") { alert(`Please fill in your ${field}.`); return; }
    }

    const totalAmount = (getTotalCartAmount() || 0) + deliveryFee - (discount || 0);

    const orderData = {
      address: data,
      items,
      amount: totalAmount,
      deliveryFee,
      distance,
      location: pinnedLocation,
      promoCode: promoCode || null,
      discount: discount || 0
    };

    try {
      const res = await axios.post(`${url}/api/order/place`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert("Order placed successfully!");
        if (res.data.session_url) {
          window.location.replace(res.data.session_url);
        } else {
          navigate("/order-success");
        }
      }
    } catch (err) {
      console.error("Order placement error:", err.response?.data || err);
      alert("Failed to place order. Please check your information and try again.");
    }
  };

  // Redirect if cart empty or not logged in
  useEffect(() => {
    if (!token || getTotalCartAmount() === 0) navigate('/cart');
  }, [token, getTotalCartAmount, navigate]);

  return (
    <form onSubmit={placeOrder} className="place-order">
      <div className="place-order-left">
        <p className="title">Delivery Location</p>

        <PickLocationMap
          initialPosition={[restaurantLocation.lat, restaurantLocation.lng]}
          pinnedLocation={pinnedLocation}
          onLocationSelect={handlePinLocation}
        />

        {!isSaved && (
          <button type="button" className="locate-btn" onClick={useMyLocation}>
            Use My Location
          </button>
        )}

        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input disabled={isSaved} required value={data.lastName} placeholder="Last name"
            onChange={e => setData({ ...data, lastName: e.target.value })} />
          <input disabled={isSaved} required value={data.firstName} placeholder="First name"
            onChange={e => setData({ ...data, firstName: e.target.value })} />
        </div>

        <input disabled={isSaved} required value={data.street} placeholder="Street"
          onChange={e => setData({ ...data, street: e.target.value })} />
        <input disabled={isSaved} value={data.barangay} placeholder="Barangay"
          onChange={e => setData({ ...data, barangay: e.target.value })} />
        <input disabled={isSaved} value={data.purok} placeholder="Purok"
          onChange={e => setData({ ...data, purok: e.target.value })} />
        <input disabled={isSaved} required value={data.email} placeholder="Email"
          onChange={e => setData({ ...data, email: e.target.value })} />

        <div className="multi-fields">
          <input disabled={isSaved} required value={data.state} placeholder="State"
            onChange={e => setData({ ...data, state: e.target.value })} />
          <input disabled={isSaved} required value={data.city} placeholder="City"
            onChange={e => setData({ ...data, city: e.target.value })} />
        </div>

        <div className="multi-fields">
          <input disabled={isSaved} required value={data.country} placeholder="Country"
            onChange={e => setData({ ...data, country: e.target.value })} />
          <input disabled={isSaved} required value={data.zipcode} placeholder="Zip code"
            onChange={e => setData({ ...data, zipcode: e.target.value })} />
        </div>

        <input disabled={isSaved} required value={data.phone} placeholder="Phone"
          onChange={e => setData({ ...data, phone: e.target.value })} />

        {!isSaved ? (
          <button type="button" className="save-info-btn" onClick={saveUserInfo}>
            Save Delivery Information
          </button>
        ) : (
          <button type="button" className="edit-info-btn" onClick={editSavedInfo}>
            Edit Saved Information
          </button>
        )}
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>

          <div className="cart-total-details">
            <p>Subtotal</p>
            <p>₱{getTotalCartAmount()}</p>
          </div>

          <div className="cart-total-details">
            <p>Delivery Fee</p>
            <p>₱{deliveryFee}</p>
          </div>

          {discount > 0 && (
            <div className="cart-total-details">
              <p>Discount</p>
              <p>₱{discount.toFixed(2)}</p>
            </div>
          )}

          <hr />

          <div className="cart-total-details">
            <b>Total</b>
            <b>₱{getTotalCartAmount() + deliveryFee - discount}</b>
          </div>

          <div className="cart-total-details">
            <p>Distance: {distance.toFixed(2)} km</p>
          </div>

          <button type="submit">PROCEED TO PAYMENT</button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
