import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import multer from "multer";
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
// APP SETUP
// -----------------------------
const app = express();
const port = process.env.PORT || 4000;

// -----------------------------
// CORS CONFIGURATION
// -----------------------------
const allowedOrigins = [
  "https://quickbite-frontend-j6bc.onrender.com",
  "https://quickbite-admin-03en.onrender.com",
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // server-to-server / Postman
    const allowed = allowedOrigins.some(o => origin.startsWith(o));
    if (allowed) return callback(null, true);
    console.warn("Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

// Body parser
app.use(express.json());

// Allow precise geolocation on Render
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "geolocation=(self)");
  next();
});

// -----------------------------
// MULTER FILE UPLOAD
// -----------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "_" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueSuffix);
  },
});
export const upload = multer({ storage });

// Serve uploads folder statically
app.use("/uploads", express.static("uploads"));
app.use("/images", express.static("uploads")); // legacy route

// -----------------------------
// DATABASE CONNECTION
// -----------------------------
connectDb();

// -----------------------------
// HTTP SERVER + SOCKET.IO
// -----------------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.set("io", io);

// -----------------------------
// API ROUTES
// -----------------------------
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/rider", riderRouter);
app.use("/api/rider/auth", riderAuthRouter);

// -----------------------------
// HEALTH CHECK
// -----------------------------
app.get("/", (req, res) => res.send("API Working"));

// -----------------------------
// SOCKET.IO RIDER MAPPING
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
// START SERVER
// -----------------------------
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
