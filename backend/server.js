require("dotenv").config();

console.log(
  "Razorpay Key ID loaded:",
  Boolean(process.env.RAZORPAY_KEY_ID),
  process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_")
    ? "(Test key)"
    : "(Check key prefix)",
);

console.log(
  "Razorpay Key Secret loaded:",
  Boolean(process.env.RAZORPAY_KEY_SECRET),
);

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");

const connectDB = require("./config/db");

const productRoutes = require("./routes/productRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const orderRoutes = require("./routes/orderRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const customerRoutes = require("./routes/customerRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const authRoutes = require("./routes/authRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");

const app = express();
const PORT = process.env.PORT || 8000;

// Security
app.disable("x-powered-by");
app.use(helmet());

// CORS: allow local development and the laptop's current LAN IP
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",

  // Allow the frontend opened using your laptop's IP
  "http://192.168.1.102:5173",
  "http://192.168.1.102:5174",

  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
];

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (e.g. some direct API clients)
      // are allowed. Browser requests must match an allowed origin.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked this origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Middleware
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Root health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "E-KART API is running",
  });
});

// API health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "E-KART API healthy",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wishlist", wishlistRoutes);

// 404 handler: must stay after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("API ERROR:", err.stack || err.message);

  if (res.headersSent) {
    return next(err);
  }

  if (err.message && err.message.startsWith("CORS blocked this origin:")) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// Start server
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      const baseURL = `http://192.168.1.103:5173:${PORT}`;

      console.log("======================================");
      console.log("E-KART backend started successfully");
      console.log(`Port: ${PORT}`);
      console.log("Listening on: 0.0.0.0");
      console.log(`Local API: http://localhost:${PORT}`);
      console.log(`LAN API: ${baseURL}`);
      console.log(`Health check: ${baseURL}/api/health`);
      console.log(`Products API: ${baseURL}/api/products`);
      console.log(`Categories API: ${baseURL}/api/categories`);
      console.log(`Reviews API: ${baseURL}/api/reviews`);
      console.log(`Payments API: ${baseURL}/api/payments`);
      console.log("Allowed frontend origins:", allowedOrigins);
      console.log("======================================");
    });
  } catch (error) {
    console.error("Backend startup failed.");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    process.exitCode = 1;
  }
}

startServer();
