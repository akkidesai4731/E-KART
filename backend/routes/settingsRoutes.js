const express = require("express");
const router = express.Router();

const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");

router.get("/", getSettings);
router.put("/", updateSettings);

// Temporary diagnostic: confirms this router is loaded
router.post("/", updateSettings);

module.exports = router;
