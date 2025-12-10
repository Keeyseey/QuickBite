import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

// User-friendly middleware
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer token

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId;

    const user = await userModel.findById(userId).select("-password"); // exclude sensitive fields
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
    }

    req.user = user;        // attach the full user object
    req.userId = user._id;  // attach userId for controllers
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
  }
};

// Admin-only middleware
export const authAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId;

    const user = await userModel.findById(userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role !== "admin") return res.status(403).json({ success: false, message: "Admins only" });

    req.user = user;
    req.userId = user._id;
    next();
  } catch (err) {
    console.error("Admin auth error:", err);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default authMiddleware;
