import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AdminContext } from "../../context/AdminContext";
import { assets } from "../../assets/assets";
import "./AdminProfile.css";

const AdminProfile = () => {
  const { adminToken, url, loading, adminProfile, setAdminProfile } =
    useContext(AdminContext);

  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    profileImage: assets.default_profile,
  });

  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // -------------------- Fetch Profile --------------------
  const fetchProfile = async () => {
    if (!adminToken) return;

    // Load from localStorage first
    const stored = localStorage.getItem("adminProfile");
    if (stored) {
      const parsed = JSON.parse(stored);
      setProfile({
        name: parsed.name || "",
        phone: parsed.phone || "",
        profileImage: parsed.profileImage || assets.default_profile,
      });
      setAdminProfile(parsed);
    }

    // Fetch from backend
    try {
      const res = await axios.get(`${url}/api/admin/profile`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.data.success && res.data.data) {
        const d = res.data.data;

        const profileData = {
          name: d.name || "",
          phone: d.phone || "",
          profileImage: d.profileImage
            ? `${url}${d.profileImage.replace(/\\/g, "/")}`
            : assets.default_profile,
        };

        setProfile(profileData);
        setAdminProfile(profileData);
        localStorage.setItem("adminProfile", JSON.stringify(profileData));
      }
    } catch (err) {
      console.error("Failed to fetch admin profile:", err);
    }
  };

  useEffect(() => {
    if (!loading && adminToken) fetchProfile();
  }, [loading, adminToken]);

  // -------------------- Handlers --------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value || "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setProfile((prev) => ({
        ...prev,
        profileImage: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile.name || !profile.phone) {
      alert("Name and phone are required");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("phone", profile.phone);
      if (imageFile) formData.append("profileImage", imageFile);

      // ✅ Use PUT for Multer backend
      const res = await axios.put(`${url}/api/admin/profile`, formData, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        const updatedImage = res.data.data.profileImage
          ? `${url}${res.data.data.profileImage.replace(/\\/g, "/")}`
          : assets.default_profile;

        const updated = {
          name: profile.name || "",
          phone: profile.phone || "",
          profileImage: updatedImage,
        };

        setProfile(updated);
        setAdminProfile(updated);
        localStorage.setItem("adminProfile", JSON.stringify(updated));

        alert("Admin profile updated successfully!");
        setImageFile(null);
      }
    } catch (err) {
      console.error("Error updating admin profile:", err);
      alert(err.response?.data?.message || "Error updating admin profile");
    } finally {
      setSaving(false);
    }
  };

  // -------------------- UI --------------------
  if (loading) return <p>Loading profile...</p>;
  if (!adminToken) return <p>You are not logged in.</p>;

  return (
    <div className="admin-profile">
      <h2>Admin Profile</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            name="name"
            value={profile.name || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Phone:</label>
          <input
            name="phone"
            value={profile.phone || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Profile Image:</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          <img
            src={profile.profileImage || assets.default_profile}
            alt="Preview"
            style={{
              width: "100px",
              marginTop: "10px",
              borderRadius: "8px",
              objectFit: "cover",
            }}
          />
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
};

export default AdminProfile;
