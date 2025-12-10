import mongoose from "mongoose";

export const connectDb = async () => {
    try {
        await mongoose.connect(
            'mongodb+srv://fermilankylaclaire:05022005@cluster0.gjqz3iw.mongodb.net/QuickBite'
        );
        console.log("MongoDB Atlas connected successfully");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1); // optional: exit app if DB connection fails
    }
};
