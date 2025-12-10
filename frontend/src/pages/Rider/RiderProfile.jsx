import React, { useState, useEffect, useContext } from "react";
import { RiderContext } from "../../context/RiderContext";
import axios from "axios";
import { assets } from "../../assets/assets";
import "./RiderProfile.css";

const RiderProfile = () => {
  const { token, url, loading, riderProfile, setRiderProfile } = useContext(RiderContext);

  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    profileImage: assets.default_profile,
  });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch profile from localStorage first, then backend
  const fetchProfile = async () => {
    if (!token) return;

    // Load from localStorage if exists
    const storedProfile = localStorage.getItem("riderProfile");
    if (storedProfile) {
      const parsedProfile = JSON.parse(storedProfile);
      setProfile(parsedProfile);
      setRiderProfile(parsedProfile);
    }

    // Fetch latest profile from backend
    try {
      const res = await axios.get(`${url}/api/rider/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success && res.data.data) {
        const data = res.data.data;
        const fullImage = data.profileImage ? `${url}${data.profileImage}` : assets.default_profile;

        const profileData = {
          name: data.name || "",
          phone: data.phone || "",
          profileImage: fullImage,
        };

        setProfile(profileData);
        setRiderProfile(profileData);
        localStorage.setItem("riderProfile", JSON.stringify(profileData));
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err.response?.data || err);
    }
  };

  useEffect(() => {
    if (!loading && token) fetchProfile();
  }, [loading, token]);

  const handleChange = (e) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setProfile((prev) => ({
        ...prev,
        profileImage: URL.createObjectURL(file), // preview before upload
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

      const res = await axios.put(`${url}/api/rider/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        alert("Profile updated successfully!");

        const updatedImage = res.data.data.profileImage
          ? `${url}${res.data.data.profileImage}`
          : assets.default_profile;

        const updatedProfile = {
          name: profile.name || "Rider",
          phone: profile.phone || "",
          profileImage: updatedImage,
        };

        setProfile(updatedProfile);
        setRiderProfile(updatedProfile);
        localStorage.setItem("riderProfile", JSON.stringify(updatedProfile));
        setImageFile(null);
      }
    } catch (err) {
      console.error("Failed to update profile:", err.response?.data || err);
      alert(err.response?.data?.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading profile...</p>;
  if (!token) return <p>You are not logged in.</p>;

  return (
    <div className="rider-profile">
      <h2>My Profile</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input name="name" value={profile.name} onChange={handleChange} required />
        </div>

        <div>
          <label>Phone:</label>
          <input name="phone" value={profile.phone} onChange={handleChange} required />
        </div>

        <div>
          <label>Profile Image:</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          <img
            src={profile.profileImage || assets.default_profile}
            alt="Profile Preview"
            onError={(e) => (e.target.src = assets.default_profile)}
            style={{ width: "100px", marginTop: "10px", borderRadius: "8px", objectFit: "cover" }}
          />
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
};

export default RiderProfile;
