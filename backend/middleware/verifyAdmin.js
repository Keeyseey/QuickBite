import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.token;

  if (!authHeader) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check role
    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admins only" });
    }

    // Fetch full admin object
    const admin = await userModel.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Attach full admin data to request
    req.admin = admin;

    next();
  } catch (err) {
    console.error("verifyAdmin error:", err);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default verifyAdmin;
