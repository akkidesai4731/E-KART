const Settings = require("../models/Settings");

const allowedFields = [
  "storeName",
  "storeEmail",
  "storePhone",
  "storeAddress",
  "currency",
  "shippingFee",
  "freeShippingThreshold",
  "taxRate",
  "maintenanceMode",
  "allowCustomerRegistration",
];

const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: "main" });

    if (!settings) {
      settings = await Settings.create({ key: "main" });
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid JSON object",
      });
    }

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid settings fields provided",
      });
    }

    const stringFields = [
      "storeName",
      "storeEmail",
      "storePhone",
      "storeAddress",
      "currency",
    ];

    for (const field of stringFields) {
      if (updates[field] !== undefined && typeof updates[field] !== "string") {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string`,
        });
      }
    }

    for (const field of ["maintenanceMode", "allowCustomerRegistration"]) {
      if (updates[field] !== undefined && typeof updates[field] !== "boolean") {
        return res.status(400).json({
          success: false,
          message: `${field} must be true or false`,
        });
      }
    }

    for (const field of ["shippingFee", "freeShippingThreshold", "taxRate"]) {
      if (updates[field] !== undefined) {
        if (
          typeof updates[field] !== "number" ||
          !Number.isFinite(updates[field]) ||
          updates[field] < 0
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a non-negative number`,
          });
        }
      }
    }

    if (updates.taxRate !== undefined && updates.taxRate > 100) {
      return res.status(400).json({
        success: false,
        message: "Tax rate cannot exceed 100",
      });
    }

    if (updates.storeName !== undefined) {
      updates.storeName = updates.storeName.trim();

      if (!updates.storeName) {
        return res.status(400).json({
          success: false,
          message: "Store name cannot be empty",
        });
      }
    }

    if (updates.storeEmail !== undefined) {
      updates.storeEmail = updates.storeEmail.trim().toLowerCase();

      if (
        updates.storeEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.storeEmail)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid store email",
        });
      }
    }

    if (updates.currency !== undefined) {
      if (!["INR", "USD", "EUR", "GBP"].includes(updates.currency)) {
        return res.status(400).json({
          success: false,
          message: "Unsupported currency",
        });
      }
    }

    let settings = await Settings.findOne({ key: "main" });

    if (!settings) {
      settings = new Settings({ key: "main" });
    }

    // Update only fields explicitly allowed above.
    for (const [field, value] of Object.entries(updates)) {
      settings.set(field, value);
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("UPDATE SETTINGS ERROR:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Failed to update settings"
          : error.message,
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
