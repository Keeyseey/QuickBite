import React, { useContext, useEffect } from 'react';
import './Verify.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';

const Verify = () => {
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success");
  const orderId = searchParams.get("orderId"); // keep for reference
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();

  const verifyPayment = async () => {
    if (!token) {
      alert("You must be logged in to verify the order.");
      navigate("/"); // redirect to home if no token
      return;
    }

    try {
      // Connect to updated backend
      const response = await axios.get(
        `${url}/api/order/verify`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { success, orderId } // Stripe sends success & orderId in query
        }
      );

      if (response.data.success) {
        // Payment succeeded → redirect to My Orders
        navigate("/myorders");
      } else {
        // Payment failed → show alert + redirect home
        alert("Payment failed or cancelled.");
        navigate("/");
      }
    } catch (err) {
      console.error("Verify order error:", err);
      alert("Error verifying payment. Please try again.");
      navigate("/");
    }
  };

  useEffect(() => {
    verifyPayment();
  }, []);

  return (
    <div className='verify'>
      <div className="spinner"></div>
    </div>
  );
};

export default Verify;
