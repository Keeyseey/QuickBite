import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { RiderContext } from "../../context/RiderContext";
import RiderMap from "../../components/RiderMap/RiderMap";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./RiderDashboard.css";

const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Order Details - #{order.orderNumber}</h3>
        <p><strong>User:</strong> {order.userName}</p>
        <p><strong>Phone:</strong> {order.userPhone}</p>
        <p><strong>Address:</strong> {order.fullAddress}</p>
        <p><strong>Items:</strong></p>
        <ul>
          {order.items.map((item, i) => (
            <li key={i}>{item.name} x {item.quantity}</li>
          ))}
        </ul>
        <p><strong>Amount:</strong> ₱{order.amount}</p>
        <p><strong>Status:</strong> {order.status}</p>
        {order.riderName && <p><strong>Rider:</strong> {order.riderName} | {order.riderPhone}</p>}
        <button className="btn-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const RiderDashboard = () => {
  const navigate = useNavigate();
  const { url, token, riderId, riderProfile } = useContext(RiderContext);
  const riderName = riderProfile?.name || "Rider";
  const riderPhone = riderProfile?.phone || "";

  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("Orders");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [deliveryProofFiles, setDeliveryProofFiles] = useState({}); 
  const [showDeliveryInput, setShowDeliveryInput] = useState({});
  const socketRef = useRef(null);

  // 🚨 Redirect if not logged in
  if (!token) {
    return null;
  }
  
  useEffect(() => {
    if (!token) {
      navigate("/rider-welcome", { replace: true }); 
    }
  }, [token]);

  // ---------------- SOCKET.IO ----------------
  useEffect(() => {
    if (!token || !riderId) return;

    // Initialize socket
    socketRef.current = io(url, { auth: { token } });

    socketRef.current.on("connect", () => {
      console.log("Socket connected for rider:", riderId);
    });

    socketRef.current.on("newOrderDelivery", (data) => {
      if (String(data.riderId) === String(riderId)) {
        const notif = {
          orderNumber: data.orderNumber,
          userName: data.userName || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
          address: data.address || {},
        };
        setNotifications((prev) => [notif, ...prev]);
        toast.info(`New Order #${notif.orderNumber} ready for delivery!`);
        fetchOrders();
      }
    });

    socketRef.current.on("orderStatusUpdated", () => fetchOrders());

    socketRef.current.on("disconnect", () => console.log("Socket disconnected"));

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, riderId, url]);

  // ---------------- FETCH ORDERS ----------------
  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${url}/api/rider/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const mappedOrders = res.data.orders
          .filter((o) => !o.rider || String(o.rider.riderId) === String(riderId))
          .map((order) => {
            const { firstName, lastName, phone } = order.address || {};
            return {
              ...order,
              userName: `${firstName || ""} ${lastName || ""}`.trim(),
              userPhone: phone || "",
              fullAddress: order.address
                ? `${order.address.street || ""}${order.address.barangay ? ", " + order.address.barangay : ""}${order.address.purok ? ", " + order.address.purok : ""}, ${order.address.city || ""}, ${order.address.state || ""}, ${order.address.country || ""}, ${order.address.zipcode || ""}`
                : "",
              riderName: order.rider?.name || riderName,
              riderPhone: order.rider?.phone || riderPhone,
            };
          });

        mappedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
      toast.error("Failed to fetch orders");
    }
  };

  useEffect(() => {
    if (token && riderId) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [token, riderId]);

  // ---------------- UPDATE STATUS ----------------
  const updateStatus = async (orderId, status) => {
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append("status", status);

      if (status === "Delivered" && deliveryProofFiles[orderId]) {
        formData.append("deliveryProof", deliveryProofFiles[orderId]);
      }

      const res = await axios.put(
        `${url}/api/order/rider/status/${orderId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        toast.success(`Order status updated to ${status}`);
        setDeliveryProofFiles((prev) => ({ ...prev, [orderId]: null }));
        setShowDeliveryInput((prev) => ({ ...prev, [orderId]: false }));
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status");
    }
  };

  // ---------------- REMOVE NOTIFICATIONS ----------------
  useEffect(() => {
    if (orders.length === 0) return;
    setNotifications((prev) =>
      prev.filter((notif) => {
        const order = orders.find((o) => o.orderNumber === notif.orderNumber);
        return order?.status === "Pending";
      })
    );
  }, [orders]);

  // ---------------- FILTER + SEARCH ----------------
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus ? o.status === filterStatus : true;
    const matchesSearch =
      o.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.orderNumber && o.orderNumber.toString().includes(searchTerm)) ||
      o._id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeOrders = filteredOrders.filter((o) => o.status !== "Delivered");
  const deliveredOrders = filteredOrders.filter((o) => o.status === "Delivered");

  return (
    <div className="rider-dashboard">
      <ToastContainer />
      <h2>Rider Dashboard</h2>

      {notifications.length > 0 && (
        <div className="rider-notifications">
          {notifications.map((notif, i) => (
            <div key={i} className="notification">
              <p>Order #{notif.orderNumber} ready for delivery</p>
              <p>Customer: {notif.userName}</p>
              <p>Address: {notif.address?.street || ""}, {notif.address?.city || ""}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="dashboard-tabs">
        {["Orders", "Delivered Orders", "Stats", "Map"].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders Tab */}
      {activeTab === "Orders" && (
        <div className="orders-tab">
          <div className="filter-search">
            <select onChange={(e) => setFilterStatus(e.target.value)} value={filterStatus}>
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Picked Up">Picked Up</option>
              <option value="Out for Delivery">Out for Delivery</option>
            </select>
            <input
              type="text"
              placeholder="Search by name, order ID, or number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>User</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Address</th>
                <th>Status</th>
                <th>Rider</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map((order) => (
                <tr key={order._id}>
                  <td>#{order.orderNumber}</td>
                  <td>
                    <div>{order.userName}</div>
                    <div style={{ fontSize: "12px", color: "#555" }}>{order.userPhone}</div>
                  </td>
                  <td>{order.items.map((item, i) => (<div key={i}>{item.name} x {item.quantity}</div>))}</td>
                  <td>₱{order.amount}</td>
                  <td>{order.fullAddress}</td>
                  <td className={`status ${order.status.replace(" ", "-").toLowerCase()}`}>{order.status}</td>
                  <td>{order.riderName} | {order.riderPhone}</td>
                  <td className="actions">
                    <button className="btn-view" onClick={() => setSelectedOrder(order)}>View</button>

                    {order.status !== "Delivered" && (
                      <>
                        <button className="btn-status" onClick={() => updateStatus(order._id, "Picked Up")}>Picked Up</button>
                        <button className="btn-status" onClick={() => updateStatus(order._id, "Out for Delivery")}>Out for Delivery</button>

                        {!showDeliveryInput[order._id] ? (
                          <button
                            className="btn-status"
                            onClick={() => setShowDeliveryInput((prev) => ({ ...prev, [order._id]: true }))}
                          >
                            Delivered
                          </button>
                        ) : (
                          <div style={{ marginTop: "5px" }}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setDeliveryProofFiles((prev) => ({ ...prev, [order._id]: e.target.files[0] }))}
                            />
                            <button
                              className="btn-status"
                              onClick={() => updateStatus(order._id, "Delivered")}
                              disabled={!deliveryProofFiles[order._id]}
                              style={{ marginTop: "5px" }}
                            >
                              Confirm Delivery
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {order.location?.lat && order.location?.lng && (
                      <button
                        className="btn-locate"
                        onClick={() => {
                          setSelectedLocation({
                            lat: order.location.lat,
                            lng: order.location.lng,
                            userName: order.userName,
                            fullAddress: order.fullAddress,
                            orderNumber: order.orderNumber,
                            userId: order.userId
                          });
                          setActiveTab("Map");
                        }}
                      >
                        Locate Customer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delivered Orders Tab */}
      {activeTab === "Delivered Orders" && (
        <div className="delivered-tab">
          <input
            type="text"
            placeholder="Search by name, order ID, or number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>User</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Address</th>
                <th>Status</th>
                <th>Rider</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveredOrders.map((order) => (
                <tr key={order._id}>
                  <td>#{order.orderNumber}</td>
                  <td>
                    <div>{order.userName}</div>
                    <div style={{ fontSize: "12px", color: "#555" }}>{order.userPhone}</div>
                  </td>
                  <td>{order.items.map((item, i) => (<div key={i}>{item.name} x {item.quantity}</div>))}</td>
                  <td>₱{order.amount}</td>
                  <td>{order.fullAddress}</td>
                  <td className="status delivered">{order.status}</td>
                  <td>{order.riderName} | {order.riderPhone}</td>
                  <td className="actions">
                    <button className="btn-view" onClick={() => setSelectedOrder(order)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === "Stats" && (
        <div className="stats-tab">
          <div className="stats-cards">
            <div className="card">Total Orders: {orders.length}</div>
            <div className="card">Completed Orders: {deliveredOrders.length}</div>
            <div className="card">Earnings: ₱{orders.reduce((sum, o) => sum + o.amount, 0)}</div>
          </div>
        </div>
      )}

      {/* Map Tab */}
      {activeTab === "Map" && (
        <div className="map-tab">
          <h3>Delivery Map</h3>
          {selectedLocation ? (
            <RiderMap location={selectedLocation} />
          ) : (
            <div className="map-placeholder">Select a customer to locate</div>
          )}
        </div>
      )}

      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
};

export default RiderDashboard;
