import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";
import Stripe from "stripe";
import multer from "multer";
import path from "path";

// Accurate conversion (₱ → USD)
const PHP_TO_USD = 1 / 59.02;

// Stripe setup
const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.warn("⚠️ STRIPE_SECRET_KEY missing. Stripe disabled.");
        return null;
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// ========================
// Multer setup for delivery proof
// ========================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/deliveryProofs/"); // make sure folder exists
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

export const uploadDeliveryProof = multer({ storage }).single("deliveryProof");

// ======================================================
// PLACE ORDER
// ======================================================
export const placeOrder = async (req, res) => {
    const frontend_url = "https://quickbite-frontend-j6bc.onrender.com";

    try {
        const userId = req.userId;
        const { items, amount, address, deliveryFee, distance, location } = req.body;

        if (!items || items.length === 0) return res.status(400).json({ success: false, message: "Cart empty" });

        // ✅ Create a pending order in DB
        const newOrder = new orderModel({
            userId,
            items,
            amount,
            deliveryFee,
            distance,
            address,
            location,
            payment: false,
            rider: null
        });
        await newOrder.save();

        // Stripe checkout
        const stripe = getStripe();
        let session_url = null;
        if (stripe) {
            const line_items = items.map((item) => ({
                price_data: {
                    currency: "usd",
                    product_data: { name: item.name },
                    unit_amount: Math.round(item.price * PHP_TO_USD * 100),
                },
                quantity: item.quantity,
            }));
            if (deliveryFee) line_items.push({
                price_data: { currency: "usd", product_data: { name: "Delivery Fee" }, unit_amount: Math.round(deliveryFee * PHP_TO_USD * 100) },
                quantity: 1
            });

            const session = await stripe.checkout.sessions.create({
                line_items,
                mode: "payment",
                success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
                cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
            });

            session_url = session.url;
        }

        // ✅ Send orderId + Stripe URL
        res.json({ success: true, orderId: newOrder._id, session_url });

    } catch (error) {
        console.error("Place Order Error:", error);
        res.status(500).json({ success: false, message: "Error placing order" });
    }
};


// ======================================================
// VERIFY ORDER PAYMENT
// ======================================================
export const verifyOrder = async (req, res) => {
    try {
        const { success, orderId } = req.query;
        if (!orderId) return res.status(400).json({ success: false, message: "OrderId missing" });

        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            return res.json({ success: true, message: "Payment verified", orderId });
        } else {
            // Payment failed → delete pending order
            await orderModel.findByIdAndDelete(orderId);
            return res.json({ success: false, message: "Payment failed" });
        }
    } catch (error) {
        console.error("Verify Order Error:", error);
        res.status(500).json({ success: false, message: "Error verifying payment" });
    }
};
// ======================================================
// GET USER ORDERS
// ======================================================
export const userOrders = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId)
            return res.status(401).json({ success: false, message: "User not authenticated" });

        const orders = await orderModel.find({ userId });
        res.json({ success: true, data: orders });

    } catch (error) {
        console.error("User Orders Error:", error);
        res.status(500).json({ success: false, message: "Error fetching user orders" });
    }
};

// ======================================================
// GET ALL ORDERS (ADMIN)
// ======================================================
export const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error("List Orders Error:", error);
        res.status(500).json({ success: false, message: "Error fetching orders" });
    }
};

// ======================================================
// ASSIGN RIDER TO ORDER
// ======================================================
export const assignRider = async (req, res) => {
  try {
    const { orderId, riderId } = req.body;

    if (!riderId || !mongoose.Types.ObjectId.isValid(riderId)) {
      return res.status(400).json({ success: false, message: "Invalid riderId" });
    }

    // Find rider in users collection
    const rider = await userModel.findOne({ _id: riderId, role: "rider" });
    if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });

    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Assign rider info
    order.rider = {
      riderId: new mongoose.Types.ObjectId(riderId),
      name: rider.name,
      phone: rider.phone || "",
    };
    order.status = "Rider Assigned";

    await order.save();

    const io = req.app.get("io");
    io.emit("newOrderDelivery", {
        orderNumber: order.orderNumber,
        riderId: rider._id.toString(),
        userName: `${order.address.firstName || ""} ${order.address.lastName || ""}`.trim(),
        address: order.address,
        location: order.location,
    });


    res.json({ success: true, message: "Rider Assigned", order });

  } catch (err) {
    console.error("Assign Rider Error:", err);
    res.status(500).json({ success: false, message: "Error assigning rider" });
  }
};

// ======================================================
// UPDATE ORDER STATUS (ADMIN OR RIDER) WITH DELIVERY PROOF
// ======================================================
export const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { orderId } = req.params;

        const order = await orderModel.findById(orderId);
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found" });

        // Require delivery proof if marking as Delivered
        if (status === "Delivered") {
            if (!req.file)
                return res.status(400).json({ success: false, message: "Delivery proof image is required" });

            order.deliveryProof = req.file.filename;
            order.timeline.deliveredAt = new Date();
        }

        if (status === "Picked Up") order.timeline.pickedUpAt = new Date();
        if (status === "Out for Delivery") order.timeline.outForDeliveryAt = new Date();

        order.status = status;
        await order.save();

        const io = req.app.get("io");
        io.emit("orderStatusUpdated", {
            orderId: order._id,
            status: order.status,
        });

        res.json({ success: true, message: "Status Updated", order });

    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ success: false, message: "Error updating status" });
    }
};

// ======================================================
// DELETE ORDER
// ======================================================
export const deleteOrder = async (req, res) => {
    const { orderId } = req.body;

    try {
        await orderModel.findByIdAndDelete(orderId);
        res.json({ success: true, message: "Order deleted" });

    } catch (error) {
        console.error("Delete Order Error:", error);
        res.status(500).json({ success: false, message: "Error deleting order" });
    }
};
