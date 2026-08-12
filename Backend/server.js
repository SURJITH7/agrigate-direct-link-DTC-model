import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables FIRST, before any other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import express from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import fs from "fs";
import errorHandler, { notFound } from "./middleware/errorMiddleware.js";

// API routes
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import activityRouter from "./routes/activity.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRouter from "./routes/payment.js";
import { protect, optionalProtect, isFarmer, isAdmin } from "./middleware/authMiddleware.js";
// If you need to generate a JWT secret key, do it once and set it in your .env file
// const generatedSecretKey = crypto.randomBytes(32).toString("base64");
// console.log("Generated JWT Secret Key:", generatedSecretKey);

connectDB();

const app = express();

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, "public/images");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// const FRONTEND_URL =
//   process.env.NODE_ENV === "production"
//     ? "https://YOUR-FRONTEND-URL.onrender.com" // or your Vercel URL
//     : "http://localhost:5173";

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));
// Serve uploaded files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

const PORT = process.env.PORT || 5000;

// Auth routes (OTP verification)
app.use("/api/auth", authRoutes);
// Product routes should be partially public for consumers to view.
// Protection for creating/updating/deleting products should be handled
// within the productsRouter file itself on specific routes (e.g., POST, PUT, DELETE).
app.use("/api/products", (req, res, next) => {
  // Protect non-GET requests and optionally authenticate GET requests
  if (req.method !== 'GET') {
    return protect(req, res, next);
  }
  return optionalProtect(req, res, next);
}, productsRouter);
// Mount orders router with authentication only so consumers can create orders (POST)
// and farmers can retrieve orders (GET). Role checks are enforced inside the router.
app.use("/api/orders", protect, ordersRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/activity", protect, isFarmer, activityRouter);
app.use("/api/admin", protect, isAdmin, adminRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

// Create HTTP server and attach socket.io
const server = http.createServer(app);
const io = new IOServer(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
  },
});

// liveLocations keyed by userId -> { lat, lng, socketId, updatedAt }
const liveLocations = {};

io.use((socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie || "";
    const match = cookie.match(/token=([^;]+)/);
    if (!match) return next();
    const token = match[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    return next();
  } catch (err) {
    console.error("Socket auth error:", err.message);
    return next();
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected", socket.id, "userId:", socket.userId);

  // Join user-specific room for notifications
  if (socket.userId) {
    socket.join(`user_${socket.userId}`);
    
    // Check if user is a farmer and join farmer room
    User.findById(socket.userId).then(user => {
      if (user && user.role === 'farmer') {
        socket.join(`farmer_${socket.userId}`);
        console.log(`Farmer ${socket.userId} joined farmer room`);
      }
    }).catch(err => {
      console.error('Error checking user role for socket room:', err.message);
    });
  }

  socket.on("sendLocation", async (data) => {
    try {
      const { lat, lng } = data;
      const userKey = socket.userId || socket.id;
      liveLocations[userKey] = {
        lat,
        lng,
        socketId: socket.id,
        updatedAt: new Date(),
      };

      // If authenticated, persist to user document (last known)
      if (socket.userId) {
        try {
          await User.findByIdAndUpdate(socket.userId, {
            latitude: lat,
            longitude: lng,
          });
        } catch (dbErr) {
          console.error("Failed to persist user location:", dbErr.message);
        }
      }

      io.emit("updateLocations", liveLocations);
    } catch (err) {
      console.error("sendLocation handler error:", err);
    }
  });

  socket.on("disconnect", () => {
    // remove entries matching this socket id
    Object.keys(liveLocations).forEach((key) => {
      if (liveLocations[key].socketId === socket.id) {
        delete liveLocations[key];
      }
    });
    io.emit("updateLocations", liveLocations);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use(notFound);
app.use(errorHandler);

export { io };
