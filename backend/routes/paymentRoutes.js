const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");

const Product = require("../models/Product");
//const Order = require("../models/Order");

const router = express.Router();

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay API keys are not configured");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// POST /api/payments/create-order
router.post("/create-order", async (req, res) => {
  let savedOrder;

  try {
    const { items, delivery } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const fields = ["fullName", "email", "phone", "address", "city", "pinCode"];

    if (
      !delivery ||
      fields.some(
        (field) =>
          typeof delivery[field] !== "string" || !delivery[field].trim(),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete all delivery details",
      });
    }

    const quantities = new Map();

    for (const item of items) {
      const id = String(item.productId || "");
      const quantity = Number(item.quantity);

      if (
        !mongoose.isValidObjectId(id) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 20
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID or quantity",
        });
      }

      const totalQuantity = (quantities.get(id) || 0) + quantity;

      if (totalQuantity > 20) {
        return res.status(400).json({
          success: false,
          message: "Maximum quantity per product is 20",
        });
      }

      quantities.set(id, totalQuantity);
    }

    const ids = [...quantities.keys()];
    const products = await Product.find({
      _id: { $in: ids },
    });

    if (products.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products were not found",
      });
    }

    let totalPaise = 0;
    const orderItems = [];

    for (const product of products) {
      const price = Number(product.price);
      const quantity = quantities.get(String(product._id));

      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid product price",
        });
      }

      const pricePaise = Math.round(price * 100);
      totalPaise += pricePaise * quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        imageUrl: product.imageUrl || product.image || "",
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

    // Save a pending order in MongoDB first.
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

    // Create the corresponding Razorpay order.
    const razorpayOrder = await getRazorpay().orders.create({
      amount: totalPaise,
      currency: "INR",
      receipt: savedOrder.orderNumber,
    });

    savedOrder.razorpayOrderId = razorpayOrder.id;
    await savedOrder.save();

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
    console.error("Create order error:", error);

    // Avoid leaving a pending order if creation failed.
    // If Razorpay created an order before the database save
    // failed, reconcile it before allowing another payment.
    if (savedOrder && !savedOrder.razorpayOrderId) {
      try {
        await Order.findByIdAndDelete(savedOrder._id);
      } catch (cleanupError) {
        console.error("Order cleanup failed:", cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order",
    });
  }
});

// POST /api/payments/verify
router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

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

    const razorpay = getRazorpay();

    // Find the order that belongs to this Razorpay order ID.
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

    // Verify the signature using the backend secret.
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

    // Fetch the payment directly from Razorpay.
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

    // Idempotent retry: don't downgrade or recreate a paid order.
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

    order.razorpayPaymentId = razorpay_payment_id;
    order.paymentStatus = "Paid";
    order.orderStatus = "Processing";

    await order.save();

    return res.json({
      success: true,
      orderPaid: true,
      orderNumber: order.orderNumber,
      message: "Payment verified and order confirmed",
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment",
    });
  }
});

module.exports = router;
