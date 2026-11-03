const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");

const Product = require("../models/Product");
const Order = require("../models/Order.js");

const router = express.Router();

// ==========================================
// RAZORPAY CONFIGURATION
// ==========================================

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay API keys are missing in Render environment variables",
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

// ==========================================
// CREATE RAZORPAY PAYMENT ORDER
// POST /api/payments/create-order
// ==========================================

router.post("/create-order", async (req, res) => {
  let savedOrder = null;

  try {
    console.log("CREATE PAYMENT ORDER REQUEST RECEIVED");

    // 1. Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB is not connected");
    }

    // 2. Get checkout details
    const { items, delivery } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    // 3. Validate delivery details
    const requiredFields = [
      "fullName",
      "email",
      "phone",
      "address",
      "city",
      "pinCode",
    ];

    if (
      !delivery ||
      requiredFields.some(
        (field) =>
          typeof delivery[field] !== "string" || !delivery[field].trim(),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete all delivery details",
      });
    }

    // 4. Validate product IDs and quantities
    const quantities = new Map();

    for (const item of items) {
      const productId = String(item.productId || "");
      const quantity = Number(item.quantity);

      if (
        !mongoose.isValidObjectId(productId) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 20
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID or quantity",
        });
      }

      const totalQuantity = (quantities.get(productId) || 0) + quantity;

      if (totalQuantity > 20) {
        return res.status(400).json({
          success: false,
          message: "Maximum quantity per product is 20",
        });
      }

      quantities.set(productId, totalQuantity);
    }

    // 5. Fetch actual products from MongoDB
    const productIds = [...quantities.keys()];

    const products = await Product.find({
      _id: { $in: productIds },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products were not found",
      });
    }

    // 6. Calculate order amount using database prices
    let totalPaise = 0;
    const orderItems = [];

    for (const product of products) {
      const price = Number(product.price);
      const quantity = quantities.get(String(product._id));

      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for product: ${product.name}`,
        });
      }

      // Convert rupees to paise
      const pricePaise = Math.round(price * 100);

      totalPaise += pricePaise * quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        imageUrl:
          product.imageUrl || product.image || product.images?.[0] || "",
        quantity,
        price: pricePaise / 100,
      });
    }

    if (!Number.isSafeInteger(totalPaise) || totalPaise < 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount",
      });
    }

    const totalAmount = totalPaise / 100;

    console.log("PRODUCTS VALIDATED SUCCESSFULLY");
    console.log("Total amount:", totalAmount);

    // 7. Save pending order in MongoDB
    savedOrder = await Order.create({
      customer: {
        name: delivery.fullName.trim(),
        email: delivery.email.trim(),
        phone: delivery.phone.trim(),
      },

      items: orderItems,

      shippingAddress: {
        address: delivery.address.trim(),
        city: delivery.city.trim(),
        postalCode: delivery.pinCode.trim(),
        country: "India",
      },

      subtotal: totalAmount,
      shippingFee: 0,
      totalAmount,

      paymentMethod: "Razorpay",
      paymentStatus: "Pending",
      orderStatus: "Pending",
    });

    console.log("MONGODB ORDER CREATED:", savedOrder.orderNumber);

    // 8. Create Razorpay order
    const razorpay = getRazorpay();

    const razorpayOrder = await razorpay.orders.create({
      amount: totalPaise,
      currency: "INR",
      receipt: savedOrder.orderNumber,
    });

    console.log("RAZORPAY ORDER CREATED:", razorpayOrder.id);

    // 9. Save Razorpay order ID in MongoDB
    savedOrder.razorpayOrderId = razorpayOrder.id;

    await savedOrder.save();

    console.log("PAYMENT ORDER CREATED SUCCESSFULLY");

    // 10. Send response to frontend
    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      orderNumber: savedOrder.orderNumber,
    });
  } catch (error) {
    // ======================================
    // DETAILED ERROR DIAGNOSTICS
    // ======================================

    console.error("\n========== PAYMENT ORDER ERROR ==========");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error description:", error.description);
    console.error("Error code:", error.code);
    console.error("Error status:", error.statusCode);
    console.error("MongoDB state:", mongoose.connection.readyState);
    console.error("==========================================\n");

    // Remove incomplete pending order if Razorpay
    // order creation failed before an ID was saved.
    if (savedOrder && !savedOrder.razorpayOrderId) {
      try {
        await Order.findByIdAndDelete(savedOrder._id);
        console.log("Incomplete pending order deleted.");
      } catch (cleanupError) {
        console.error("Order cleanup failed:", cleanupError.message);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order",
      error:
        process.env.NODE_ENV === "production"
          ? "Payment order creation failed. Check backend logs."
          : error.message,
    });
  }
});

// ==========================================
// VERIFY RAZORPAY PAYMENT
// POST /api/payments/verify
// ==========================================

router.post("/verify", async (req, res) => {
  try {
    console.log("PAYMENT VERIFICATION REQUEST RECEIVED");

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // 1. Validate payment details
    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification details",
      });
    }

    // 2. Check Razorpay configuration
    const razorpay = getRazorpay();

    // 3. Find matching order in MongoDB
    const order = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
      paymentMethod: "Razorpay",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Matching order not found",
      });
    }

    // 4. Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!/^[a-f0-9]{64}$/i.test(razorpay_signature)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const expected = Buffer.from(expectedSignature, "hex");
    const received = Buffer.from(razorpay_signature, "hex");

    if (
      expected.length !== received.length ||
      !crypto.timingSafeEqual(expected, received)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // 5. Fetch actual payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured" ||
      payment.currency !== "INR" ||
      payment.amount !== Math.round(order.totalAmount * 100)
    ) {
      return res.status(409).json({
        success: false,
        orderPaid: false,
        message: "Payment is not captured or does not match the order",
      });
    }

    // 6. Handle already-paid orders safely
    if (order.paymentStatus === "Paid") {
      if (order.razorpayPaymentId !== razorpay_payment_id) {
        return res.status(409).json({
          success: false,
          message: "Order is already paid using another payment",
        });
      }

      return res.json({
        success: true,
        orderPaid: true,
        orderNumber: order.orderNumber,
        message: "Order is already confirmed",
      });
    }

    if (order.paymentStatus !== "Pending") {
      return res.status(409).json({
        success: false,
        message: "This order cannot be marked as paid",
      });
    }

    // 7. Update order after successful verification
    order.razorpayPaymentId = razorpay_payment_id;
    order.paymentStatus = "Paid";
    order.orderStatus = "Processing";

    await order.save();

    console.log("PAYMENT SUCCESSFULLY VERIFIED:", order.orderNumber);

    return res.json({
      success: true,
      orderPaid: true,
      orderNumber: order.orderNumber,
      message: "Payment verified and order confirmed",
    });
  } catch (error) {
    console.error("\n========== PAYMENT VERIFICATION ERROR ==========");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error description:", error.description);
    console.error("Error code:", error.code);
    console.error("Error status:", error.statusCode);
    console.error("================================================\n");

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment",
    });
  }
});

module.exports = router;
