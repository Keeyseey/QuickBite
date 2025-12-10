import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const riderLogin = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email and password are required" });
    }

    // Normalize email
    email = email.trim().toLowerCase();
    console.log("Login attempt email (normalized):", email);

    // Find rider in DB (only role: "rider")
    const rider = await userModel.findOne({ email, role: "rider" });
    console.log("Rider found from DB:", rider);

    if (!rider) {
      return res.json({ success: false, message: "Rider not found" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, rider.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Incorrect password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: rider._id, role: "rider" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, token });
  } catch (err) {
    console.error("Rider login error:", err);
    res.json({ success: false, message: "Server error" });
  }
};
