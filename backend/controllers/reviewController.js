const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");

// GET /api/reviews/:productId
// Fetch current reviews and recalculate the count and average rating.
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Always read the latest reviews from the Review collection.
    const reviews = await Review.find({
      product: product._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    const count = reviews.length;

    const averageRating =
      count > 0
        ? Number(
            (
              reviews.reduce(
                (total, review) => total + Number(review.rating || 0),
                0,
              ) / count
            ).toFixed(1),
          )
        : 0;

    // Synchronize the product summary with the actual reviews.
    if (product.numReviews !== count || product.rating !== averageRating) {
      product.numReviews = count;
      product.rating = averageRating;
      await product.save();
    }

    return res.status(200).json({
      success: true,
      count,
      averageRating,
      reviews,
    });
  } catch (error) {
    console.error("Get product reviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product reviews.",
      error: error.message,
    });
  }
};

// POST /api/reviews/:productId
// Save a review and update the product summary.
exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { customerName, rating, comment } = req.body || {};

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    if (
      typeof customerName !== "string" ||
      !customerName.trim() ||
      customerName.trim().length > 80
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter your name (maximum 80 characters).",
      });
    }

    const numericRating = Number(rating);

    if (
      rating === undefined ||
      rating === null ||
      rating === "" ||
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select a rating from 1 to 5 stars.",
      });
    }

    if (
      typeof comment !== "string" ||
      !comment.trim() ||
      comment.trim().length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a review (maximum 1000 characters).",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Create the review in the separate Review collection.
    const review = await Review.create({
      product: product._id,
      customerName: customerName.trim(),
      rating: numericRating,
      comment: comment.trim(),
    });

    // Recalculate the summary from the database.
    const summary = await Review.aggregate([
      {
        $match: {
          product: product._id,
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const count = summary[0]?.count ?? 0;

    const averageRating =
      count > 0 ? Number(summary[0].averageRating.toFixed(1)) : 0;

    // Update only the summary fields in Product.
    product.numReviews = count;
    product.rating = averageRating;

    await product.save();

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      count,
      averageRating,
      review,
    });
  } catch (error) {
    console.error("Create product review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit review.",
      error: error.message,
    });
  }
};
