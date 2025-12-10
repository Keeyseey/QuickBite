import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import './AddRider.css';

const AddRider = ({ url }) => {
  const [data, setData] = useState({ name: "", email: "", password: "" });

  // Make sure this key matches what you stored during admin login
  const token = localStorage.getItem("adminToken");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Admin not logged in");
      return;
    }

    try {
      const res = await axios.post(
        `${url}/api/admin/create-rider`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (res.data.success) {
        toast.success("Rider account created successfully!");
        setData({ name: "", email: "", password: "" });
      } else {
        toast.error(res.data.message || "Failed to create rider");
      }
    } catch (err) {
      console.error(err.response || err);
      if (err.response?.status === 401) {
        toast.error("Unauthorized: Invalid admin token");
      } else {
        toast.error("Server error");
      }
    }
  };

  return (
    <div className="add-rider-container">
      <div className="add-rider-card">
        <h2>Create Rider Account</h2>
        <form onSubmit={handleSubmit}>
          <label>Name</label>
          <input
            name="name"
            value={data.name}
            onChange={handleChange}
            placeholder="Rider Name"
            required
          />
          <label>Email</label>
          <input
            name="email"
            value={data.email}
            onChange={handleChange}
            placeholder="Rider Email"
            type="email"
            required
          />
          <label>Password</label>
          <input
            name="password"
            value={data.password}
            onChange={handleChange}
            placeholder="Password"
            type="password"
            required
          />
          <button type="submit">Create Rider</button>
        </form>
      </div>
    </div>
  );
};

export default AddRider;
