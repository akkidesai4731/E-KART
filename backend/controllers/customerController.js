const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/order");
const bcrypt = require("bcryptjs");

// GET /api/customers
const getAllCustomers = async (req, res) => {
  try {
    const { search, active, page = 1, limit = 20 } = req.query;

    const filter = { role: "customer" };

    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;

    if (search?.trim()) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
      ];
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const [customers, total] = await Promise.all([
      User.find(filter)
        .select("name email phone isActive createdAt")
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Calculate order count and spending for the listed customers.
    const customerIds = customers.map((customer) => customer._id);

    const orderStats = await Order.aggregate([
      {
        $match: {
          "customer.user": { $in: customerIds },
          orderStatus: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: "$customer.user",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
        },
      },
    ]);

    const statsMap = new Map(
      orderStats.map((item) => [String(item._id), item]),
    );

    const data = customers.map((customer) => {
      const stats = statsMap.get(String(customer._id));

      return {
        ...customer,
        orderCount: stats?.orderCount || 0,
        totalSpent: stats?.totalSpent || 0,
      };
    });

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
};

// GET /api/customers/:id
const getCustomerById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await User.findOne({
      _id: req.params.id,
      role: "customer",
    })
      .select("name email phone isActive createdAt")
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const orders = await Order.find({
      "customer.user": customer._id,
    })
      .select(
        "orderNumber items totalAmount paymentStatus orderStatus createdAt",
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        ...customer,
        orders,
        orderCount: orders.length,
        totalSpent: orders
          .filter((order) => order.orderStatus !== "Cancelled")
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      },
    });
  } catch (error) {
    console.error("Get customer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer details",
    });
  }
};

// PATCH /api/customers/:id/status
const updateCustomerStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    if (typeof req.body.isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const customer = await User.findOneAndUpdate(
      { _id: req.params.id, role: "customer" },
      { isActive: req.body.isActive },
      { new: true, runValidators: true },
    ).select("name email phone isActive createdAt");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer status updated successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Update customer status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update customer status",
    });
  }
};

// DELETE /api/customers/:id
const deleteCustomer = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await User.findOne({
      _id: req.params.id,
      role: "customer",
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Preserve order history; do not delete orders automatically.
    await customer.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Customer account deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
    });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name, email, phone = "", password } = req.body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 72 characters",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name cannot exceed 100 characters",
      });
    }

    if (typeof phone !== "string") {
      return res.status(400).json({
        success: false,
        message: "Phone must be a string",
      });
    }

    // Check for an existing account
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // Never accept role or isActive from the request body.
    // Admin-created accounts are customers by default.
    const customer = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: "customer",
      isActive: true,
    });

    // Never return password or authentication secrets.
    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
      },
    });
  } catch (error) {
    // Handles duplicate emails even if two requests arrive together.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomerStatus,
  deleteCustomer,
};
