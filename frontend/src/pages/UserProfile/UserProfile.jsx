import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import "./UserProfile.css";

const UserProfile = () => {
  const { token, url, user, setUser } = useContext(StoreContext);

  const [profile, setProfile] = useState({
    name: "",
    profileImage: assets.default_profile,
  });

  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch profile from backend
  const fetchProfile = async () => {
    if (!token) return;

    try {
      const res = await axios.get(`${url}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success && res.data.data) {
        const data = res.data.data;
        const fullImage = data.profileImage ? `${url}${data.profileImage}` : assets.default_profile;

        setProfile({
          name: data.name || "",
          profileImage: fullImage,
        });

        setUser({
          ...user,
          name: data.name,
          profileImage: fullImage,
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err.response?.data || err);
    }
  };

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
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
    if (!profile.name) {
      alert("Name is required");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      if (imageFile) formData.append("profileImage", imageFile);

      const res = await axios.put(`${url}/api/user/profile`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        alert("Profile updated successfully!");
        const updatedImage = res.data.data.profileImage
          ? `${url}${res.data.data.profileImage}`
          : assets.default_profile;

        setProfile({ ...profile, profileImage: updatedImage });
        setUser({ ...user, name: profile.name, profileImage: updatedImage });
        setImageFile(null);
      }
    } catch (err) {
      console.error("Failed to update profile:", err.response?.data || err);
      alert(err.response?.data?.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (!token) return <p>You are not logged in.</p>;

  return (
    <div className="user-profile">
      <h2>My Profile</h2>
      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div>
          <label>Name:</label>
          <input name="name" value={profile.name} onChange={handleChange} required />
        </div>

        {/* Profile Image */}
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

export default UserProfile;
