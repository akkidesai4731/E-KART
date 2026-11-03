const Category = require("../models/Category");

// GET /api/categories
const getAllCategories = async (req, res) => {
  try {
    const { search, active } = req.query;
    const filter = {};

    if (search) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;

    const categories = await Category.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// GET /api/categories/:id
const getCategoryById = async (req, res) => {
  try {
    if (!require("mongoose").isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category",
    });
  }
};

// POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, description = "", imageUrl = "", isActive = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description,
      imageUrl,
      isActive,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name or slug already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    if (!require("mongoose").isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const allowedFields = ["name", "description", "imageUrl", "isActive"];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name cannot be empty",
        });
      }

      updates.name = updates.name.trim();
      updates.slug = updates.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name or slug already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

// PATCH /api/categories/:id/status
const updateCategoryStatus = async (req, res) => {
  try {
    if (!require("mongoose").isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    if (typeof req.body.isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true, runValidators: true },
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category status updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Update category status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category status",
    });
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    if (!require("mongoose").isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
};
