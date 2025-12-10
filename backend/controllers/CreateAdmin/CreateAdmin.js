// CreateAdmin.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import userModel from "./models/userModel.js"; // adjust path

const MONGO_URI = "mongodb+srv://fermilankylaclaire:05022005@cluster0.gjqz3iw.mongodb.net/QuickBite?retryWrites=true&w=majority";

const CreateAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected");

        const adminEmail = "Carl_Ramos@gmail.com";
        const adminPassword = "Admin123!";
        const adminName = "Carl Jibney D. Ramos";

        const adminExists = await userModel.findOne({ email: adminEmail, role: "admin" });
        if (adminExists) {
            console.log("Admin already exists");
        } else {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            await userModel.create({
                name: adminName,
                email: adminEmail,
                password: hashedPassword,
                role: "admin",
                cartData: {}
            });

            console.log("Admin account created successfully");
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error("Error creating admin:", err);
        await mongoose.connection.close();
    }
};

CreateAdmin();
