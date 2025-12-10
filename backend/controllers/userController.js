import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

// Create JWT token
const createToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" } // Token valid for 7 days
    );
};

// ------------------- Auth -------------------

// Login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) return res.json({ success: false, message: "User doesn't exist" });

        if (user.role === "admin") {
            return res.json({ success: false, message: "Admin accounts cannot log in here. Use admin panel." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.json({ success: false, message: "Invalid credentials" });

        const token = createToken(user);
        const redirect = user.role === "rider" ? "/rider-dashboard" : "/";

        res.json({ success: true, token, redirect });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Server error" });
    }
};

// Register user
const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const exists = await userModel.findOne({ email });
        if (exists) return res.json({ success: false, message: "User already exists" });

        if (!validator.isEmail(email)) return res.json({ success: false, message: "Enter a valid email" });
        if (password.length < 8) return res.json({ success: false, message: "Password too short" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            role: role || "user"
        });

        const user = await newUser.save();
        const token = createToken(user);
        const redirect = user.role === "rider" ? "/rider-dashboard" : "/";

        res.json({ success: true, token, redirect });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Server error" });
    }
};

// ------------------- Delivery Info -------------------

// Save or update delivery info
const saveDeliveryInfo = async (req, res) => {
    try {
        const { data, pinnedLocation } = req.body;
        const userId = req.user.id; // from auth middleware

        if (!data || !pinnedLocation) {
            return res.status(400).json({ success: false, message: "Missing delivery data or location" });
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            {
                savedAddress: data,
                currentLocation: pinnedLocation
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Delivery info saved",
            deliveryInfo: {
                data: user.savedAddress,
                pinnedLocation: user.currentLocation
            }
        });
    } catch (err) {
        console.error("Save delivery info error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get delivery info
const getDeliveryInfo = async (req, res) => {
    try {
        const userId = req.user.id; // from auth middleware
        const user = await userModel.findById(userId);

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({
            success: true,
            deliveryInfo: {
                data: user.savedAddress || {},
                pinnedLocation: user.currentLocation || null
            }
        });
    } catch (err) {
        console.error("Get delivery info error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export {
    loginUser,
    registerUser,
    saveDeliveryInfo,
    getDeliveryInfo
};
