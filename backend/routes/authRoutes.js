const express = require("express");

const {
  registerUser,
  loginCustomer,
  getMe,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/auth/register
// Register a new customer
router.post("/register", registerUser);

// POST /api/auth/login
// Login a customer or admin
router.post("/login", loginCustomer);

// GET /api/auth/me
// Get the currently logged-in user's profile
router.get("/me", protect, getMe);

module.exports = router;
