import express from "express";
import { loginUser, registerUser, saveDeliveryInfo, getDeliveryInfo } from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const userRouter = express.Router();

// ============================
// MULTER SETUP (Profile Image Upload)
// ============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./uploads/profileImages";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user._id}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"));
  }
});

// ============================
// Auth routes
// ============================
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

// ============================
// User saved address endpoints
// ============================
userRouter.put("/save-delivery-info", authMiddleware, saveDeliveryInfo);
userRouter.get("/delivery-info", authMiddleware, getDeliveryInfo);

// ============================
// Promo endpoints
// ============================
// Check if user has used promo
userRouter.get("/promo-status", authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authorized" });

    const user = req.user;
    res.json({
      success: true,
      hasUsedPromo: user.hasUsedPromo || false,
      lastPromoCode: user.lastPromoCode || null,
      lastDiscount: user.lastDiscount || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Apply/save promo code
userRouter.put("/use-promo", authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authorized" });

    const { promoCode, discount } = req.body;
    if (!promoCode || discount === undefined) {
      return res.status(400).json({ success: false, message: "Promo code and discount required" });
    }

    const user = req.user;
    user.hasUsedPromo = true;
    user.lastPromoCode = promoCode;
    user.lastDiscount = discount;
    await user.save();

    res.json({
      success: true,
      hasUsedPromo: user.hasUsedPromo,
      lastPromoCode: user.lastPromoCode,
      lastDiscount: user.lastDiscount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============================
// User profile endpoints
// ============================

// Get user profile
userRouter.get("/profile", authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authorized" });

    res.json({
      success: true,
      data: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || "",
        profileImage: req.user.profileImage || null,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update user profile (name, phone, profile image)
userRouter.put("/profile", authMiddleware, upload.single("profileImage"), async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authorized" });

    const { name, phone } = req.body;
    if (name) req.user.name = name;
    if (phone) req.user.phone = phone;

    if (req.file) {
      req.user.profileImage = `/uploads/profileImages/${req.file.filename}`;
    }

    await req.user.save();

    res.json({
      success: true,
      data: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        profileImage: req.user.profileImage,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default userRouter;
