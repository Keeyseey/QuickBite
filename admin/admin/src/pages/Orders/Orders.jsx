import React, { useState, useEffect, useContext } from 'react';
import './Orders.css';
import axios from 'axios';
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import { AdminContext } from '../../context/AdminContext';

const Orders = () => {
  const { url, adminToken } = useContext(AdminContext);
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [now, setNow] = useState(Date.now());


  const fetchAllOrders = async () => {
    if (!adminToken) return toast.error("Admin not logged in!");
    try {
      const response = await axios.get(`${url}/api/order/list`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (response.data.success) setOrders(response.data.data);
      else toast.error("Failed to fetch orders");
    } catch (err) {
      toast.error("Network error or unauthorized");
      console.error(err);
    }
  };

  const fetchRiders = async () => {
    if (!adminToken) return;
    try {
      const res = await axios.get(`${url}/api/admin/riders`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.data.success) setRiders(res.data.data);
      else toast.error("Failed to fetch riders");
    } catch (err) {
      toast.error("Failed to fetch riders");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllOrders();
    fetchRiders();
  }, [adminToken]); // ✅ refetch if token changes

  useEffect(() => {
  const interval = setInterval(() => {
    setNow(Date.now());
  }, 1000);

  return () => clearInterval(interval);
}, []);


  const statusHandler = async (event, orderId) => {
    if (!adminToken) return;
    try {
      await axios.post(`${url}/api/order/status`,
        { orderId, status: event.target.value },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      fetchAllOrders();
    } catch (err) {
      toast.error("Error updating status");
      console.error(err);
    }
  };

  const assignRider = async (orderId, riderId) => {
    if (!adminToken) return;
    try {
      const res = await axios.post(`${url}/api/order/assign-rider`,
        { orderId, riderId },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.data.success) toast.success("Rider assigned successfully!");
      else toast.error(res.data.message);
      fetchAllOrders();
    } catch (err) {
      toast.error("Error assigning rider");
      console.error(err);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?") || !adminToken) return;
    try {
      const res = await axios.post(`${url}/api/order/delete`,
        { orderId },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.data.success) toast.success("Order deleted");
      else toast.error("Failed to delete order");
      fetchAllOrders();
    } catch (err) {
      toast.error("Error deleting order");
      console.error(err);
    }
  };

  const processingOrders = orders.filter(o => o.status !== "Delivered");
  const deliveredOrders = orders.filter(o => o.status === "Delivered");

  const getOrderAge = (createdAt) => {
    const diffMs = now - new Date(createdAt).getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
  
    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds} seconds ago`;
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  };

  const renderOrderItem = (order, isDelivered = false) => (
    <div key={order._id} className="order-item">
      <img src={assets.parcel_icon} alt="" />
      <div>
        <div className='order-item-food'>
          {order.items.map((item, i) => (
            <span key={i}>{item.name} x {item.quantity}{i < order.items.length - 1 ? ", " : ""}</span>
          ))}
        </div>
        <p className='order-item-name'>{order.address.firstName} {order.address.lastName}</p>
        <div className='order-item-address'>
          <p>{order.address.street},</p>
          <p>{order.address.city}, {order.address.state}, {order.address.country}, {order.address.zipcode}</p>
        </div>
        <p className='order-item-phone'>{order.address.phone}</p>
      </div>
      <p>Items: {order.items.length}</p>
      <p>₱{order.amount}</p>
      <p className="order-time">🕒 {getOrderAge(order.createdAt)}</p>
      <select onChange={e => statusHandler(e, order._id)} value={order.status}>
        <option value="Food Processing">Food Processing</option>
        <option value="Out for Delivery">Out for Delivery</option>
        <option value="Delivered">Delivered</option>
      </select>
      <select onChange={e => assignRider(order._id, e.target.value)} value={order.rider?.riderId || ""}>
        <option value="">Assign Rider</option>
        {riders.map(r => <option key={r._id} value={r._id}>{r.name} | {r.phone}</option>)}
      </select>
      {isDelivered && <button className="delete-btn" onClick={() => deleteOrder(order._id)}>Delete</button>}
    </div>
  );

  return (
    <div className='order add'>
      <h3>Order Page</h3>
      <div className="order-tabs">
        <button className={activeTab === "active" ? "active-tab" : ""} onClick={() => setActiveTab("active")}>Active Orders</button>
        <button className={activeTab === "delivered" ? "active-tab" : ""} onClick={() => setActiveTab("delivered")}>Delivered Orders</button>
      </div>
      <div className="order-list">
        {activeTab === "active"
          ? processingOrders.length ? processingOrders.map(o => renderOrderItem(o)) : <p>No active orders</p>
          : deliveredOrders.length ? deliveredOrders.map(o => renderOrderItem(o, true)) : <p>No delivered orders</p>}
      </div>
    </div>
  );
};

export default Orders;
