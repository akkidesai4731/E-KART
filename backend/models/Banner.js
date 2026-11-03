const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    subtitle: {
      type: String,
      default: "",
      trim: true,
    },

    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },

    buttonText: {
      type: String,
      default: "Shop Now",
    },

    linkUrl: {
      type: String,
      default: "/products",
    },

    placement: {
      type: String,
      enum: ["home-hero", "home-middle", "category", "popup"],
      default: "home-hero",
    },

    priority: {
      type: Number,
      default: 0,
      min: 0,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

bannerSchema.pre("validate", function () {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date must be after start date");
  }
});

module.exports = mongoose.model("Banner", bannerSchema);
