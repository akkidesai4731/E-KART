const express = require("express");
const router = express.Router();

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
} = require("../controllers/WishlistController");

const { protect } = require("../middleware/authMiddleware");

// Get all wishlist products for the logged-in user
router.get("/", protect, getWishlist);

// Add a product to the wishlist
router.post("/add", protect, addToWishlist);

// Add or remove a product using the toggle API
router.post("/toggle", protect, toggleWishlist);

// Remove a product using its MongoDB product ID
router.delete("/:productId", protect, removeFromWishlist);

module.exports = router;
