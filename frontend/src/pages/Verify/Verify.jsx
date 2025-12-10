import React, { useContext, useEffect } from 'react'
import './Verify.css'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';

const Verify = () => {
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success");
  const orderId = searchParams.get("orderId");
  const { url, token } = useContext(StoreContext); // ✅ get token
  const navigate = useNavigate();

  const verifyPayment = async () => {
    if (!token) {
      alert("You must be logged in to verify the order.");
      navigate("/"); // redirect to home if no token
      return;
    }

    try {
      const response = await axios.post(
        `${url}/api/order/verify`,
        { success, orderId },
        { headers: { Authorization: `Bearer ${token}` } } // ✅ include token
      );

      if (response.data.success) {
        navigate("/myorders");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Verify order error:", err);
      navigate("/"); // fallback
    }
  }

  useEffect(() => {
    verifyPayment();
  }, [])

  return (
    <div className='verify'>
      <div className="spinner"></div>
    </div>
  )
}

export default Verify;
