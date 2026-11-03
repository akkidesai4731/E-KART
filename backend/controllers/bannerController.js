const mongoose = require("mongoose");
const Banner = require("../models/Banner");

// GET ALL BANNERS
const getAllBanners = async (req, res) => {
  try {
    const { search, active, placement } = req.query;

    const filter = {};

    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;

    if (placement) filter.placement = placement;

    if (search) {
      filter.title = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    const banners = await Banner.find(filter).sort({
      priority: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    console.error("Get banners error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch banners",
    });
  }
};

// GET SINGLE BANNER
const getBannerById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner ID",
      });
    }

    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch banner",
    });
  }
};

// CREATE BANNER
const createBanner = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      imageUrl,
      buttonText,
      linkUrl,
      placement,
      priority,
      startDate,
      endDate,
      isActive,
    } = req.body;

    if (!title?.trim() || !imageUrl?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and image URL are required",
      });
    }

    const banner = await Banner.create({
      title: title.trim(),
      subtitle,
      imageUrl: imageUrl.trim(),
      buttonText,
      linkUrl,
      placement,
      priority,
      startDate: startDate || null,
      endDate: endDate || null,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Create banner error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create banner",
    });
  }
};

// UPDATE BANNER
const updateBanner = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner ID",
      });
    }

    const allowedFields = [
      "title",
      "subtitle",
      "imageUrl",
      "buttonText",
      "linkUrl",
      "placement",
      "priority",
      "startDate",
      "endDate",
      "isActive",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    Object.assign(banner, updates);
    await banner.save();

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Update banner error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to update banner",
    });
  }
};

// UPDATE BANNER STATUS
const updateBannerStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner ID",
      });
    }

    if (typeof req.body.isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true, runValidators: true },
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Banner status updated successfully",
      data: banner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update banner status",
    });
  }
};

// DELETE BANNER
const deleteBanner = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner ID",
      });
    }

    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete banner",
    });
  }
};

module.exports = {
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  updateBannerStatus,
  deleteBanner,
};
