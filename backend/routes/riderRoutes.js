import express from "express";
import orderModel from "../models/orderModel.js";
import authRider from "../middleware/authRider.js";
import {
  getRiderProfile,
  updateRiderProfile
} from "../controllers/riderController.js";

import multer from "multer";

const riderRouter = express.Router();

// =========================
// Multer Storage (Uploads)
// =========================
const storage = multer.diskStorage({
  destination: "uploads/", 
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// =========================
// Rider Orders
// =========================
riderRouter.get("/orders", authRider, async (req, res) => {
  try {
    const riderId = req.rider._id; 

    const orders = await orderModel.find({ "rider.riderId": riderId });

    const mappedOrders = orders.map(o => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      items: o.items,
      amount: o.amount,
      status: o.status,
      address: o.address,
      location: o.location,
      riderId: o.rider?.riderId,
      riderName: o.rider?.name,
      riderPhone: o.rider?.phone,
    }));

    res.json({ success: true, orders: mappedOrders });
  } catch (err) {
    console.error("Fetch Rider Orders Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// =========================
// Rider Profile
// =========================

// Get rider profile
riderRouter.get("/profile", authRider, getRiderProfile);

// Update profile (with optional profile image upload)
riderRouter.put(
  "/profile",
  authRider,
  upload.single("profileImage"),  // <-- this enables real image upload
  updateRiderProfile
);

export default riderRouter;
