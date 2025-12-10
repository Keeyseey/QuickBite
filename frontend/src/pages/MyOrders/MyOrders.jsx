import React, { useContext, useEffect, useState } from 'react';
import './MyOrders.css';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'delivered'

  const fetchOrders = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `${url}/api/order/userorders`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(response.data.data || []);
    } catch (error) {
      console.error("Fetch orders error:", error);
      toast.error("Failed to fetch orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 30000); // auto-refresh every 30s
      return () => clearInterval(interval);
    } else {
      setLoading(false);
      setOrders([]);
    }
  }, [token]);

  // Filter orders by status
  const activeOrders = orders.filter(order => order.status !== 'Delivered');
  const deliveredOrders = orders.filter(order => order.status === 'Delivered');

  return (
    <div className='my-orders'>
      <h2>My Orders</h2>

      {/* Tabs */}
      <div className="orders-tabs">
        <button
          className={activeTab === 'active' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('active')}
        >
          Active Orders
        </button>
        <button
          className={activeTab === 'delivered' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('delivered')}
        >
          Delivered Orders
        </button>
      </div>

      <div className="container">
        {loading ? (
          <p>Loading orders...</p>
        ) : (activeTab === 'active' ? activeOrders : deliveredOrders).length === 0 ? (
          <p>No {activeTab === 'active' ? 'active' : 'delivered'} orders.</p>
        ) : (
          (activeTab === 'active' ? activeOrders : deliveredOrders).map((order, index) => (
            <div key={index} className="my-orders-order">
              <img src={assets.parcel_icon} alt="Parcel" />
              <p>
                {order.items.map((item, idx) => (
                  <span key={idx}>
                    {item.name} x {item.quantity}
                    {idx !== order.items.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
              <p>₱{order.amount}.00</p>
              <p>Items: {order.items.length}</p>
              <p>
                <span>&#x25cf;</span> <b>{order.status}</b>
              </p>

              {order.rider?.name && order.rider?.phone && (
                <p>
                  <span>&#x2705;</span> Rider: {order.rider.name} | {order.rider.phone}
                </p>
              )}

              {activeTab === 'active' && <button onClick={fetchOrders}>Refresh Status</button>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyOrders;
