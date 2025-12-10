import React, { useState, useEffect } from 'react';
import './Orders.css';
import axios from 'axios';
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [activeTab, setActiveTab] = useState("active");

  const getAdminToken = () => localStorage.getItem("adminToken");

  // Fetch all orders
  const fetchAllOrders = async () => {
    try {
      const token = getAdminToken();
      const response = await axios.get(`${url}/api/order/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) setOrders(response.data.data);
      else toast.error("Failed to fetch orders");
    } catch (err) {
      toast.error("Network error or unauthorized");
      console.error(err);
    }
  };

  // Fetch riders
  const fetchRiders = async () => {
    try {
      const token = getAdminToken();
      const res = await axios.get(`${url}/api/admin/riders`, {
        headers: { Authorization: `Bearer ${token}` },
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
  }, []);

  // Update order status
  const statusHandler = async (event, orderId) => {
    try {
      const token = getAdminToken();
      await axios.post(`${url}/api/order/status`,
        { orderId, status: event.target.value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchAllOrders();
    } catch (err) {
      toast.error("Error updating status");
      console.error(err);
    }
  };

  // Assign Rider
  const assignRider = async (orderId, riderId) => {
    try {
      const token = getAdminToken();
      const res = await axios.post(`${url}/api/order/assign-rider`,
        { orderId, riderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success("Rider assigned successfully!");
        fetchAllOrders();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Error assigning rider");
      console.error(err);
    }
  };

  // Delete order
  const deleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      const token = getAdminToken();
      const response = await axios.post(`${url}/api/order/delete`,
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("Order deleted");
        fetchAllOrders();
      } else {
        toast.error("Failed to delete order");
      }
    } catch (err) {
      toast.error("Error deleting order");
      console.error(err);
    }
  };

  // Split lists
  const processingOrders = orders.filter(order => order.status !== "Delivered");
  const deliveredOrders = orders.filter(order => order.status === "Delivered");

  // Render order card
  const renderOrderItem = (order, isDelivered = false) => (
    <div key={order._id} className="order-item">
      <img src={assets.parcel_icon} alt="" />

      <div>
        <div className='order-item-food'>
          {order.items.map((item, i) => (
            <span key={i}>
              {item.name} x {item.quantity}{i < order.items.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>

        <p className='order-item-name'>
          {order.address.firstName} {order.address.lastName}
        </p>

        <div className='order-item-address'>
          <p>{order.address.street},</p>
          <p>{order.address.city}, {order.address.state}, {order.address.country}, {order.address.zipcode}</p>
        </div>

        <p className='order-item-phone'>{order.address.phone}</p>
      </div>

      <p>Items: {order.items.length}</p>
      <p>₱{order.amount}</p>

      {/* Status dropdown */}
      <select onChange={(e) => statusHandler(e, order._id)} value={order.status}>
        <option value="Food Processing">Food Processing</option>
        <option value="Out for Delivery">Out for Delivery</option>
        <option value="Delivered">Delivered</option>
      </select>

      {/* Rider Assignment */}
      <select
        onChange={(e) => assignRider(order._id, e.target.value)}
        value={order.rider?.riderId || ""}
      >
        <option value="">Assign Rider</option>
        {riders.map(rider => (
          <option key={rider._id} value={rider._id}>
            {rider.name} | {rider.phone}
          </option>
        ))}
      </select>

      {isDelivered && (
        <button className="delete-btn" onClick={() => deleteOrder(order._id)}>
          Delete
        </button>
      )}
    </div>
  );

  return (
    <div className='order add'>
      <h3>Order Page</h3>

      <div className="order-tabs">
        <button className={activeTab === "active" ? "active-tab" : ""} onClick={() => setActiveTab("active")}>
          Active Orders
        </button>

        <button className={activeTab === "delivered" ? "active-tab" : ""} onClick={() => setActiveTab("delivered")}>
          Delivered Orders
        </button>
      </div>

      <div className="order-list">
        {activeTab === "active"
          ? processingOrders.length ? processingOrders.map(order => renderOrderItem(order)) : <p>No active orders</p>
          : deliveredOrders.length ? deliveredOrders.map(order => renderOrderItem(order, true)) : <p>No delivered orders</p>
        }
      </div>
    </div>
  );
};

export default Orders;
