import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cartData: { type: Object, default: {} },
    role: { type: String, enum: ["user", "admin", "rider"], default: "user" },
    phone: { type: String },
    profileImage: { type: String },
    currentLocation: { lat: Number, lng: Number },
    savedAddress: { 
        firstName: String,
        lastName: String,
        email: String,
        street: String,
        barangay: String,
        purok: String,
        city: String,
        state: String,
        zipcode: String,
        country: String,
        phone: String
    },
    hasUsedPromo: { type: Boolean, default: false }, // For first-time promo
    lastPromoCode: { type: String, default: "" },    // Stores last applied promo
    lastDiscount: { type: Number, default: 0 }       // Stores last discount amount
}, { minimize: false });

export default mongoose.model("User", userSchema);
