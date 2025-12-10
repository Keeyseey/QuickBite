import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import multer from "multer"; // ✅ Use multer instead of express-fileupload
import { connectDb } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import adminRoutes from "./routes/adminRoutes.js";
import riderRouter from "./routes/riderRoutes.js";
import riderAuthRouter from "./routes/riderAuthRoute.js";
import "dotenv/config";

// -----------------------------
// APP
// -----------------------------
const app = express();
const port = process.env.PORT || 4000;

// -----------------------------
// GLOBAL CORS (dynamic for multiple frontend ports)
// -----------------------------
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Body parser
app.use(express.json());

// -----------------------------
// Multer Setup (for file uploads)
// -----------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Default uploads folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "_" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueSuffix);
  },
});

export const upload = multer({ storage });

// Serve uploads folder
app.use("/uploads", express.static("uploads"));

// -----------------------------
// SERVER + SOCKET.IO
// -----------------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"), false);
    },
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

// -----------------------------
// DB
// -----------------------------
connectDb();

// -----------------------------
// API Routes
// -----------------------------
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/admin", adminRoutes); // ✅ admin profile endpoints
app.use("/api/rider", riderRouter);
app.use("/api/rider/auth", riderAuthRouter);

// -----------------------------
// Basic health check
// -----------------------------
app.get("/", (req, res) => res.send("API Working"));

// -----------------------------
// SOCKET.IO Rider Mapping
// -----------------------------
const riderSockets = {};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("registerRider", (riderId) => {
    riderSockets[riderId] = socket.id;
    console.log(`Rider ${riderId} registered with socket ${socket.id}`);
  });

  socket.on("disconnect", () => {
    for (const riderId in riderSockets) {
      if (riderSockets[riderId] === socket.id) {
        delete riderSockets[riderId];
        console.log(`Rider ${riderId} removed`);
      }
    }
  });
});

// -----------------------------
// Start server
// -----------------------------
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
