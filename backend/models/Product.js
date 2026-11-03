const mongoose = require("mongoose");

// ==========================================
// SPECIFICATION SCHEMA
// ==========================================

const specificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

// ==========================================
// HIGHLIGHT SCHEMA
// ==========================================

const highlightSchema = new mongoose.Schema(
  {
    icon: {
      type: String,
      default: "check",
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

// ==========================================
// COLOUR SCHEMA
// ==========================================

const colorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    colorCode: {
      type: String,
      default: "#000000",
      trim: true,
    },

    // Main image for this colour
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    imagePublicId: {
      type: String,
      default: "",
      trim: true,
    },

    // Colour-wise image gallery
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (images) => images.length <= 10,
        message: "Maximum 10 images per colour are allowed.",
      },
    },

    imagePublicIds: {
      type: [String],
      default: [],
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Colour stock must be a whole number.",
      },
    },
  },
  { _id: true },
);

// ==========================================
// VARIANT OPTION SCHEMA
// Example: 128GB, 256GB, 512GB
// ==========================================

const variantOptionSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    originalPrice: {
      type: Number,
      default: undefined,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Variant stock must be a whole number.",
      },
    },

    sku: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true },
);

// ==========================================
// VARIANT SCHEMA
// Example: Storage, RAM, Size
// ==========================================

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [variantOptionSchema],
      default: [],
    },
  },
  { _id: true },
);

// ==========================================
// MAIN PRODUCT SCHEMA
// ==========================================

const productSchema = new mongoose.Schema(
  {
    // BASIC INFORMATION

    name: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // PRICE AND STOCK

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    originalPrice: {
      type: Number,
      default: undefined,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number.",
      },
    },

    // MAIN PRODUCT IMAGE

    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    imagePublicId: {
      type: String,
      default: "",
      trim: true,
    },

    // GENERAL PRODUCT GALLERY

    images: {
      type: [String],
      default: [],
      validate: {
        validator: (images) => images.length <= 20,
        message: "Maximum 20 product images are allowed.",
      },
    },

    imagePublicIds: {
      type: [String],
      default: [],
    },

    // PRODUCT COLOURS

    colors: {
      type: [colorSchema],
      default: [],
      validate: {
        validator: (colors) => colors.length <= 10,
        message: "Maximum 10 product colours are allowed.",
      },
    },

    // PRODUCT VARIANTS

    variants: {
      type: [variantSchema],
      default: [],
    },

    // PRODUCT SPECIFICATIONS

    specifications: {
      type: [specificationSchema],
      default: [],
    },

    // PRODUCT HIGHLIGHTS

    highlights: {
      type: [highlightSchema],
      default: [],
      validate: {
        validator: (highlights) => highlights.length <= 30,
        message: "Maximum 30 product highlights are allowed.",
      },
    },

    // PRODUCT RATINGS

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    numReviews: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Number of reviews must be a whole number.",
      },
    },
  },
  {
    timestamps: true,
    minimize: false,
  },
);

// ==========================================
// EXPORT PRODUCT MODEL
// ==========================================

module.exports = mongoose.model("Product", productSchema);
