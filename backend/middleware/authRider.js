import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Rider authentication middleware
const authRider = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer token

  if (!token) {
    return res.status(401).json({ success: false, message: "Rider token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the rider object to the request
    const rider = await userModel.findOne({ _id: decoded.id, role: "rider" });
    if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });

    req.rider = rider; // used in controllers
    next();
  } catch (err) {
    console.error("Rider auth error:", err);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default authRider;
