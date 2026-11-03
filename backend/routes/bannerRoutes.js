const express = require("express");
const router = express.Router();

const {
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  updateBannerStatus,
  deleteBanner,
} = require("../controllers/bannerController");

router.route("/").get(getAllBanners).post(createBanner);

router.patch("/:id/status", updateBannerStatus);

router.route("/:id").get(getBannerById).put(updateBanner).delete(deleteBanner);

module.exports = router;
