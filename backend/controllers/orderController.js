const mongoose = require("mongoose");
const Order = require("../models/order.js");
const Product = require("../models/Product.js");

// GET /api/orders — List all orders (admin)
const getAllOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) {
      filter.orderStatus = status;
    }

    if (search) {
      const term = search.trim();
      filter.$or = [
        { orderNumber: { $regex: term, $options: "i" } },
        { "customer.name": { $regex: term, $options: "i" } },
        { "customer.email": { $regex: term, $options: "i" } },
      ];
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

// GET /api/orders/my-orders — Logged-in customer's orders
const getMyOrders = async (req, res) => {
  try {
    // Support either req.user.id or req.user._id from auth middleware.
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view your orders",
      });
    }

    // The order schema shown so far stores customer details.
    // Match the authenticated user's email to the order's customer email.
    const email = req.user?.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "User email is missing from the authentication token or middleware",
      });
    }

    const orders = await Order.find({
      "customer.email": email,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
      data: orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your orders",
    });
  }
};

// GET /api/orders/:id — View one order
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

// POST /api/orders — Create order
const createOrder = async (req, res) => {
  try {
    const {
      customer,
      items,
      shippingAddress,
      paymentMethod,
      shippingFee = 0,
      notes = "",
    } = req.body;

    if (
      !customer?.name ||
      !customer?.email ||
      !shippingAddress?.address ||
      !shippingAddress?.city ||
      !shippingAddress?.state ||
      !shippingAddress?.postalCode ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer, shipping address, and order items are required",
      });
    }

    const productIds = items.map((item) => item.product);

    if (productIds.some((id) => !id || !mongoose.isValidObjectId(id))) {
      return res.status(400).json({
        success: false,
        message: "Every item must contain a valid product ID",
      });
    }

    const uniqueIds = [...new Set(productIds.map(String))];

    const products = await Product.find({
      _id: { $in: uniqueIds },
      isActive: true,
    });

    if (products.length !== uniqueIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products were not found or are inactive",
      });
    }

    const productMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(String(item.product));
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Item quantity must be a positive whole number",
        });
      }

      if (Number(product.stock) < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        imageUrl: product.imageUrl || "",
        quantity,
        price: product.price,
      });

      subtotal += Number(product.price) * quantity;
    }

    const fee = Number(shippingFee);

    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({
        success: false,
        message: "Shipping fee must be a valid non-negative number",
      });
    }

    const order = await Order.create({
      customer,
      items: orderItems,
      shippingAddress,
      subtotal,
      shippingFee: fee,
      totalAmount: subtotal + fee,
      paymentMethod: paymentMethod || "COD",
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
};

// PATCH /api/orders/:id/status — Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    const { orderStatus } = req.body;

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
        allowedStatuses,
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.orderStatus === "Cancelled" ||
      order.orderStatus === "Delivered"
    ) {
      return res.status(400).json({
        success: false,
        message: "Delivered or cancelled orders cannot be changed",
      });
    }

    order.orderStatus = orderStatus;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not update order status",
    });
  }
};

// DELETE /api/orders/:id — Delete order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete order error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not delete order",
    });
  }
};

module.exports = {
  getAllOrders,
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};
