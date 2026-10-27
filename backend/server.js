import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import tournamentRoutes from "./routes/tournamentRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import activityLogRoutes from "./routes/activityLogRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sportsync";

// Parse allowed CORS origins
const rawOrigins = process.env.CLIENT_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173";
const allowedOrigins = rawOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: false, // allow loading uploaded images cross-origin
  })
);

// CORS config
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Dev-friendly
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Serve uploaded static files
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on("join:match", (matchId) => {
    socket.join(`match:${matchId}`);
    console.log(`[Socket.io] ${socket.id} joined match:${matchId}`);
  });

  socket.on("leave:match", (matchId) => {
    socket.leave(`match:${matchId}`);
    console.log(`[Socket.io] ${socket.id} left match:${matchId}`);
  });

  socket.on("join:tournament", (tournamentId) => {
    socket.join(`tournament:${tournamentId}`);
    console.log(`[Socket.io] ${socket.id} joined tournament:${tournamentId}`);
  });

  socket.on("leave:tournament", (tournamentId) => {
    socket.leave(`tournament:${tournamentId}`);
    console.log(`[Socket.io] ${socket.id} left tournament:${tournamentId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Attach io to every incoming request
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// Rate limiting for auth routes (10 attempts per 15 min for login)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // generous for dev/demo
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

// MongoDB Connection Event Listeners
mongoose.connection.on("connected", () => {
  console.log(`Connected to MongoDB [${mongoose.connection.name}] successfully.`);
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB connection disconnected. Attempting reconnection...");
});

// Health Check
app.get("/api/health", (_req, res) => {
  const readyStates = ["disconnected", "connected", "connecting", "disconnecting"];
  const stateCode = mongoose.connection.readyState;
  const dbStatus = readyStates[stateCode] || "unknown";

  res.json({
    success: true,
    service: "SportSync API",
    database: dbStatus,
    readyState: stateCode,
    dbHost: mongoose.connection.host || "none",
    dbName: mongoose.connection.name || "sportsync",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Database Guard Middleware
const dbGuard = (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message:
        "MongoDB is not currently connected. Please verify that the MongoDB service is running locally on 127.0.0.1:27017 or configure MONGODB_URI.",
      databaseStatus: mongoose.connection.readyState,
    });
  }
  next();
};

// Mount API routes
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", dbGuard, authRoutes);
app.use("/api/tournaments", dbGuard, tournamentRoutes);
app.use("/api/matches", dbGuard, matchRoutes);
app.use("/api/teams", dbGuard, teamRoutes);
app.use("/api/users", dbGuard, userRoutes);
app.use("/api/stats", dbGuard, statsRoutes);
app.use("/api/notifications", dbGuard, notificationRoutes);
app.use("/api/comments", dbGuard, commentRoutes);
app.use("/api/activity-logs", dbGuard, activityLogRoutes);
app.use("/api/upload", dbGuard, uploadRoutes);

// Root route
app.get("/", (_req, res) => {
  res.json({
    message: "SportSync Tournament Management API is operational.",
    database: mongoose.connection.name || "sportsync",
    healthEndpoint: "/api/health",
    tournamentsEndpoint: "/api/tournaments",
    authEndpoint: "/api/auth",
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use((error, _req, res, _next) => {
  console.error("[SportSync Server Error]", error);

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ success: false, message: "Invalid JSON payload in request." });
  }

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors || {}).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", ") || error.message,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid format for field "${error.path}".`,
    });
  }

  if (error.code === 11000) {
    const duplicateKey = Object.keys(error.keyValue || {})[0];
    return res.status(409).json({
      success: false,
      message: `A record with this ${duplicateKey || "value"} already exists.`,
    });
  }

  res.status(500).json({
    success: false,
    message: error.message || "Internal server error. Please check server logs.",
  });
});

// Connect to MongoDB and start HTTP Server
async function startServer() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    console.error("Warning: Initial MongoDB connection error:", error.message);
  }

  server.listen(PORT, () => {
    console.log(`SportSync Backend listening on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer();

export { app, io };
export default app;
