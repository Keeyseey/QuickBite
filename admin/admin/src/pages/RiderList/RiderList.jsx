import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import "./RiderList.css";
import { toast } from "react-toastify";
import { AdminContext } from "../../context/AdminContext";

const RiderList = () => {
  const { url, adminToken } = useContext(AdminContext); // ✅ get token & url from context
  const [riders, setRiders] = useState([]);

  const fetchRiders = async () => {
    if (!adminToken) {
      toast.error("Admin not logged in");
      return;
    }

    try {
      const res = await axios.get(`${url}/api/admin/riders`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.data.success && Array.isArray(res.data.data)) {
        setRiders(res.data.data);
      } else {
        toast.error(res.data.message || "Failed to fetch riders");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch riders");
    }
  };

  useEffect(() => {
    fetchRiders();
  }, [adminToken]); // ✅ refetch if token changes

  return (
    <div className="rider-list-container">
      <h2>Rider Accounts</h2>
      {riders.length === 0 ? (
        <p>No riders found</p>
      ) : (
        <table className="rider-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone Number</th>
            </tr>
          </thead>
          <tbody>
            {riders.map((rider) => (
              <tr key={rider._id}>
                <td>{rider.name || "N/A"}</td>
                <td>{rider.email || "N/A"}</td>
                <td>{rider.phone || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RiderList;
