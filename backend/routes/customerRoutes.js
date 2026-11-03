const express = require("express");
const router = express.Router();

const {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomerStatus,
  deleteCustomer,
} = require("../controllers/customerController");

// Create and list customers
router.route("/").get(getAllCustomers).post(createCustomer);

// Activate or deactivate a customer
router.patch("/:id/status", updateCustomerStatus);

// Get or delete one customer
router.route("/:id").get(getCustomerById).delete(deleteCustomer);

module.exports = router;
