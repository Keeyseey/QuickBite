// src/routes/adminRoutes.js
import express from "express";
import userModel from "../models/userModel.js"; // Admin & Rider in same model
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import verifyAdmin from "../middleware/verifyAdmin.js"; // checks admin role
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// ----------------------
// Multer Setup for Admin Profile Images
// ----------------------
const uploadDir = path.join("uploads", "admin");

// Ensure folder exists
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeFileName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}_${safeFileName}`);
  },
});

const upload = multer({ storage });

// ======================
// Admin Login
// ======================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await userModel.findOne({ email, role: "admin" });
    if (!admin)
      return res.status(400).json({ success: false, message: "Invalid admin credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Invalid admin credentials" });

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({ success: true, token, role: admin.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================
// Get logged-in admin profile (Protected)
// ======================
router.get("/profile", verifyAdmin, async (req, res) => {
  try {
    const admin = await userModel.findById(req.admin.id).select("-password");
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    res.json({ success: true, data: admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================
// Update logged-in admin profile (Protected, with Multer)
// ======================
router.put("/profile", verifyAdmin, upload.single("profileImage"), async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updateData = { name, phone };

    if (req.file) {
      // Store relative path for frontend
      updateData.profileImage = `/${uploadDir.replace(/\\/g, "/")}/${req.file.filename}`;
    }

    const updatedAdmin = await userModel
      .findByIdAndUpdate(req.admin.id, updateData, { new: true })
      .select("-password");

    res.json({ success: true, data: updatedAdmin });
  } catch (err) {
    console.error("Error updating admin profile:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// ======================
// Create Rider (Protected)
// ======================
router.post("/create-rider", verifyAdmin, async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await userModel.findOne({ email });
    if (exists) return res.json({ success: false, message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newRider = new userModel({ name, email, password: hashedPassword, role: "rider" });
    await newRider.save();

    res.json({ success: true, message: "Rider account created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================
// Get all riders (Protected)
// ======================
router.get("/riders", verifyAdmin, async (req, res) => {
  try {
    const riders = await userModel.find({ role: "rider" }).select("-password");
    res.json({ success: true, data: riders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
