const express = require("express");

const router = express.Router();

const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getMyOrders,
} = require("../controllers/orderController.js");

const { protect } = require("../middleware/authMiddleware.js");

// List orders and create an ordinary order, such as COD.
router.route("/").get(getAllOrders).post(createOrder);

// Orders belonging to the logged-in customer.
router.get("/my-orders", protect, getMyOrders);

// Update order status.
router.patch("/:id/status", updateOrderStatus);

// Get or delete one order.
router.route("/:id").get(getOrderById).delete(deleteOrder);

module.exports = router;
