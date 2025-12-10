import express from "express";
import orderModel from "../models/orderModel.js";
import authMiddleware, { authAdmin } from "../middleware/auth.js";
import authRider from "../middleware/authRider.js";

import {
  listOrders,
  placeOrder,
  userOrders,
  verifyOrder,
  deleteOrder,
  assignRider,
  updateStatus,
  uploadDeliveryProof,
} from "../controllers/orderController.js";

const orderRouter = express.Router();

// =========================
// USER ROUTES
// =========================
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/verify", authMiddleware, verifyOrder);
orderRouter.get("/userorders", authMiddleware, userOrders);

// =========================
// ADMIN ROUTES
// =========================
orderRouter.get("/list", authAdmin, listOrders);

// Admin assigns rider
orderRouter.post("/assign-rider", authAdmin, assignRider);

// Admin updates status (no proof required)
orderRouter.put("/status/:orderId", authAdmin, updateStatus);

// =========================
// RIDER ROUTES
// =========================
// Rider updates order status + delivery proof image
orderRouter.put(
  "/rider/status/:orderId",
  authRider,
  uploadDeliveryProof,
  updateStatus
);

// Get orders assigned to this rider
orderRouter.get("/rider/orders", authRider, async (req, res) => {
  try {
    const riderId = req.userId; // From authRider middleware

    // Fetch orders where the riderId matches
    const orders = await orderModel.find({ "rider.riderId": riderId });

    res.json({ success: true, orders });
  } catch (err) {
    console.error("Fetch Rider Orders Error:", err);
    res.status(500).json({ success: false, message: "Error fetching rider orders" });
  }
});

// =========================
// DELETE ORDER
// =========================
orderRouter.post("/delete", authAdmin, deleteOrder);

export default orderRouter;
