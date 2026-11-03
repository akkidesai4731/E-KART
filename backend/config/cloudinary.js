const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// ==========================================
// CLOUDINARY CONFIGURATION
// ==========================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==========================================
// CLOUDINARY STORAGE
// ==========================================

const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {
    const fieldName = file.fieldname || "product";

    let folder = "ekart/products/gallery";

    if (/^colorImages_\d+$/.test(fieldName)) {
      const colorIndex = fieldName.replace("colorImages_", "");

      folder = `ekart/products/colors/color_${colorIndex}`;
    }

    return {
      folder,

      public_id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${file.originalname
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-")}`,

      resource_type: "image",

      allowed_formats: ["jpg", "jpeg", "png", "webp"],

      transformation: [
        {
          width: 1200,
          height: 1200,
          crop: "limit",
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    };
  },
});

// ==========================================
// MULTER CONFIGURATION
// ==========================================

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per image
    files: 120, // Maximum 120 uploaded files
    fields: 500, // Maximum 500 text fields
    parts: 650, // Maximum multipart parts
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."));
    }

    cb(null, true);
  },
});

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  cloudinary,
  storage,
  upload,
};
