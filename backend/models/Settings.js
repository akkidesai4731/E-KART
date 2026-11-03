const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "main",
      unique: true,
      immutable: true,
    },

    storeName: {
      type: String,
      default: "E-KART",
      trim: true,
      maxlength: 100,
    },

    storeEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    storePhone: {
      type: String,
      default: "",
      trim: true,
    },

    storeAddress: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    currency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP"],
      default: "INR",
    },

    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    freeShippingThreshold: {
      type: Number,
      default: 999,
      min: 0,
    },

    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    allowCustomerRegistration: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Export the Mongoose model directly
module.exports = mongoose.model("Settings", settingsSchema);
