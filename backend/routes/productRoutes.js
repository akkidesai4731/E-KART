const express = require("express");

const router = express.Router();

// Product controller functions
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

// Cloudinary upload middleware
const { upload } = require("../config/cloudinary");

/*
  GET    /api/products
  Fetch all products

  POST   /api/products
  Create a product

  GET    /api/products/:id
  Fetch one product

  PUT    /api/products/:id
  Update an existing product

  DELETE /api/products/:id
  Delete a product
*/

// Configure multiple image uploads.
// Supports:
// - images: general product images
// - colorImages_0: images for first color
// - colorImages_1: images for second color
// - colorImages_2: images for third color
// - etc.
const productImageUpload = upload.any();

// GET all products
router.get("/", getAllProducts);

// CREATE product
router.post("/", productImageUpload, createProduct);

// GET product by ID
router.get("/:id", getProductById);

// UPDATE product by ID
router.put("/:id", productImageUpload, updateProduct);

// DELETE product by ID
router.delete("/:id", deleteProduct);

module.exports = router;
