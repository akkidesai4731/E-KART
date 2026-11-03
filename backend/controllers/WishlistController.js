const mongoose = require("mongoose");
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

// Get the logged-in user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Please log in first." });
    }

    const wishlist = await Wishlist.findOne({ user: userId }).populate(
      "products",
    );

    return res.status(200).json({
      success: true,
      wishlist: wishlist || { user: userId, products: [] },
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return res.status(500).json({ message: "Failed to load wishlist." });
  }
};

// Add a product to the wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Please log in first." });
    }

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const productExists = await Product.exists({ _id: productId });

    if (!productExists) {
      return res.status(404).json({ message: "Product not found." });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: userId },
      { $addToSet: { products: productId } },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).populate("products");

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist.",
      wishlist,
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return res.status(500).json({ message: "Failed to add product." });
  }
};

// Remove a product from the wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Please log in first." });
    }

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: userId },
      { $pull: { products: productId } },
      { new: true },
    ).populate("products");

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist.",
      wishlist: wishlist || { user: userId, products: [] },
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return res.status(500).json({ message: "Failed to remove product." });
  }
};

// Toggle: add if absent, remove if already present
exports.toggleWishlist = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Please log in first." });
    }

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const productExists = await Product.exists({ _id: productId });

    if (!productExists) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Ensure a wishlist exists for this user.
    await Wishlist.updateOne(
      { user: userId },
      { $setOnInsert: { user: userId, products: [] } },
      { upsert: true },
    );

    // Atomic update: remove if present, otherwise add.
    const updated = await Wishlist.findOneAndUpdate(
      { user: userId, products: productId },
      { $pull: { products: productId } },
      { new: true },
    );

    if (updated) {
      await updated.populate("products");

      return res.status(200).json({
        success: true,
        action: "removed",
        message: "Product removed from wishlist.",
        wishlist: updated,
      });
    }

    const added = await Wishlist.findOneAndUpdate(
      { user: userId },
      { $addToSet: { products: productId } },
      { new: true },
    ).populate("products");

    return res.status(200).json({
      success: true,
      action: "added",
      message: "Product added to wishlist.",
      wishlist: added,
    });
  } catch (error) {
    console.error("Toggle wishlist error:", error);
    return res.status(500).json({ message: "Failed to update wishlist." });
  }
};
