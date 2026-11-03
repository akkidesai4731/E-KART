const express = require("express");
const router = express.Router();

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
} = require("../controllers/categoryController");

router.route("/").get(getAllCategories).post(createCategory);

router.patch("/:id/status", updateCategoryStatus);

router
  .route("/:id")
  .get(getCategoryById)
  .put(updateCategory)
  .delete(deleteCategory);

module.exports = router;
