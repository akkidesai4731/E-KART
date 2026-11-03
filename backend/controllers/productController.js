const mongoose = require("mongoose");
const Product = require("../models/Product");
const { cloudinary } = require("../config/cloudinary");

// ==========================================
// COMMON HELPERS
// ==========================================

const parseArray = (value) => {
  if (Array.isArray(value)) return value;

  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getUploadedFiles = (req) => {
  if (Array.isArray(req.files)) return req.files;
  if (req.file) return [req.file];
  return [];
};

const getGeneralFiles = (files) =>
  files.filter((file) => file.fieldname === "images");

const getColorFiles = (files) =>
  files.filter((file) => /^colorImages_\d+$/.test(file.fieldname));

const getFileUrls = (files) => files.map((file) => file.path).filter(Boolean);

const getFilePublicIds = (files) =>
  files.map((file) => file.filename).filter(Boolean);

const getImageUrl = (image) => {
  if (typeof image === "string") return image.trim();
  if (typeof image?.url === "string") return image.url.trim();
  return "";
};

const uniqueImages = (images) => [
  ...new Set(images.map(getImageUrl).filter(Boolean)),
];

// ==========================================
// UPLOAD VALIDATION
// ==========================================

const validateUploadFields = (files) => {
  for (const file of files) {
    const valid =
      file.fieldname === "images" || /^colorImages_\d+$/.test(file.fieldname);

    if (!valid) {
      return `Unexpected image field: ${file.fieldname}`;
    }

    if (!file.path || !file.filename) {
      return "Image upload failed.";
    }
  }

  return null;
};

const validateImages = (files) => {
  const generalFiles = getGeneralFiles(files);
  const colorFiles = getColorFiles(files);

  if (generalFiles.length > 20) {
    return "Maximum 20 general product images are allowed.";
  }

  const counts = {};

  for (const file of colorFiles) {
    const match = file.fieldname.match(/^colorImages_(\d+)$/);
    const index = Number(match[1]);

    counts[index] = (counts[index] || 0) + 1;

    if (counts[index] > 10) {
      return `Maximum 10 images allowed for colour ${index + 1}.`;
    }
  }

  if (files.length > 120) {
    return "Maximum 120 uploaded images are allowed.";
  }

  return null;
};

// ==========================================
// VARIANTS
// ==========================================

const normalizeVariants = (variants) =>
  variants.map((variant) => ({
    name: String(variant.name || "").trim(),

    options: (variant.options || []).map((option) => ({
      value: String(option.value || "").trim(),
      price: Number(option.price),

      originalPrice:
        option.originalPrice === "" ||
        option.originalPrice === undefined ||
        option.originalPrice === null
          ? undefined
          : Number(option.originalPrice),

      stock: Number(option.stock ?? 0),
      sku: String(option.sku || "").trim(),
    })),
  }));

const validateVariants = (variants) => {
  const names = variants.map((v) => v.name.toLowerCase());

  if (names.some((name) => !name) || new Set(names).size !== names.length) {
    return "Variant names must be present and unique.";
  }

  for (const variant of variants) {
    if (!variant.options.length) {
      return `Add at least one option for ${variant.name}.`;
    }

    for (const option of variant.options) {
      if (
        !option.value ||
        !Number.isFinite(option.price) ||
        option.price < 0 ||
        !Number.isInteger(option.stock) ||
        option.stock < 0
      ) {
        return "Invalid variant option value, price or stock.";
      }

      if (
        option.originalPrice !== undefined &&
        (!Number.isFinite(option.originalPrice) || option.originalPrice < 0)
      ) {
        return "Invalid variant original price.";
      }
    }
  }

  return null;
};

// ==========================================
// COLOURS
// ==========================================

const prepareColors = (colors, existingColors = []) =>
  colors.map((color) => {
    const oldColor = existingColors.find((item) => {
      const sameId =
        color._id && item._id && String(color._id) === String(item._id);

      const sameName =
        String(item.name || "")
          .trim()
          .toLowerCase() ===
        String(color.name || "")
          .trim()
          .toLowerCase();

      return sameId || sameName;
    });

    // Submitted images replace old images.
    // Missing image fields preserve old images.
    const submittedImages =
      color.images !== undefined
        ? parseArray(color.images)
        : oldColor?.images || [];

    const submittedIds =
      color.imagePublicIds !== undefined
        ? parseArray(color.imagePublicIds)
        : oldColor?.imagePublicIds || [];

    const images = uniqueImages(submittedImages).slice(0, 10);

    return {
      _id: color._id || oldColor?._id,
      name: String(color.name || "").trim(),
      colorCode: String(
        color.colorCode || oldColor?.colorCode || "#000000",
      ).trim(),

      imageUrl: String(color.imageUrl || "").trim() || images[0] || "",

      imagePublicId: color.imagePublicId || submittedIds[0] || "",

      images,

      imagePublicIds: [...new Set(submittedIds.filter(Boolean))],

      stock:
        color.stock === undefined || color.stock === ""
          ? (oldColor?.stock ?? 0)
          : Number(color.stock),
    };
  });

const attachColorUploads = (colors, files) => {
  const result = colors.map((color) => ({
    ...color,
    images: [...(color.images || [])],
    imagePublicIds: [...(color.imagePublicIds || [])],
  }));

  files.forEach((file) => {
    const match = file.fieldname.match(/^colorImages_(\d+)$/);
    if (!match) return;

    const index = Number(match[1]);
    if (!result[index]) return;

    result[index].images.push(file.path);
    result[index].imagePublicIds.push(file.filename);
  });

  result.forEach((color) => {
    color.images = uniqueImages(color.images).slice(0, 10);
    color.imageUrl = color.images[0] || "";
    color.imagePublicIds = [...new Set(color.imagePublicIds.filter(Boolean))];
    color.imagePublicId = color.imagePublicIds[0] || "";
  });

  return result;
};

const validateColors = (colors) => {
  if (colors.length > 10) {
    return "Maximum 10 product colours are allowed.";
  }

  const names = colors.map((color) => color.name.toLowerCase());

  if (names.some((name) => !name) || new Set(names).size !== names.length) {
    return "Colour names must be present and unique.";
  }

  for (const color of colors) {
    if (!Number.isInteger(Number(color.stock)) || Number(color.stock) < 0) {
      return `Invalid stock for colour ${color.name}.`;
    }
  }

  return null;
};

// ==========================================
// SPECIFICATIONS AND HIGHLIGHTS
// ==========================================

const normalizeSpecifications = (items) =>
  items
    .filter((item) => item?.name?.trim() && String(item?.value ?? "").trim())
    .map((item) => ({
      name: String(item.name).trim(),
      value: String(item.value).trim(),
    }));

const normalizeHighlights = (items) =>
  items
    .filter((item) => item?.title?.trim())
    .map((item) => ({
      icon: String(item.icon || "check").trim(),
      title: String(item.title).trim(),
    }));

// ==========================================
// CLOUDINARY HELPERS
// ==========================================

const getAllPublicIds = (product) => {
  const ids = [];

  if (product.imagePublicId) ids.push(product.imagePublicId);

  if (Array.isArray(product.imagePublicIds)) {
    ids.push(...product.imagePublicIds);
  }

  (product.colors || []).forEach((color) => {
    if (color.imagePublicId) ids.push(color.imagePublicId);

    if (Array.isArray(color.imagePublicIds)) {
      ids.push(...color.imagePublicIds);
    }
  });

  return [...new Set(ids.filter(Boolean))];
};

const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
  } catch (error) {
    console.error("Cloudinary deletion error:", publicId, error.message);
  }
};

const deleteCloudinaryImages = async (publicIds) => {
  await Promise.all(
    [...new Set(publicIds.filter(Boolean))].map(deleteCloudinaryImage),
  );
};

// ==========================================
// CREATE PRODUCT
// POST /api/products
// ==========================================

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      brand,
      stock,
      imageUrl,
      images,
      colors,
      variants,
      specifications,
      highlights,
    } = req.body;

    const files = getUploadedFiles(req);

    const fieldError = validateUploadFields(files);
    if (fieldError) {
      return res.status(400).json({ success: false, message: fieldError });
    }

    const imageError = validateImages(files);
    if (imageError) {
      return res.status(400).json({ success: false, message: imageError });
    }

    if (
      !name?.trim() ||
      !category?.trim() ||
      price === undefined ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid product name, category and price are required.",
      });
    }

    if (
      stock !== undefined &&
      (!Number.isInteger(Number(stock)) || Number(stock) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a valid non-negative number.",
      });
    }

    const generalFiles = getGeneralFiles(files);
    const uploadedUrls = getFileUrls(generalFiles);
    const uploadedIds = getFilePublicIds(generalFiles);

    const finalImages = uniqueImages([
      ...(imageUrl ? [imageUrl] : []),
      ...parseArray(images),
      ...uploadedUrls,
    ]).slice(0, 20);

    const submittedColors = parseArray(colors);
    let finalColors = prepareColors(submittedColors);
    finalColors = attachColorUploads(finalColors, files);

    const colorError = validateColors(finalColors);
    if (colorError) {
      return res.status(400).json({ success: false, message: colorError });
    }

    const finalVariants = normalizeVariants(parseArray(variants));
    const variantError = validateVariants(finalVariants);

    if (variantError) {
      return res.status(400).json({ success: false, message: variantError });
    }

    const finalSpecifications = normalizeSpecifications(
      parseArray(specifications),
    );

    const finalHighlights = normalizeHighlights(parseArray(highlights));

    const hasColorImages = finalColors.some((color) => color.images.length > 0);

    if (finalImages.length === 0 && !hasColorImages) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one product image.",
      });
    }

    const mainImage =
      finalImages[0] ||
      finalColors.find((color) => color.images.length > 0)?.images[0] ||
      "";

    const product = await Product.create({
      name: name.trim(),
      description: description || "",
      price: Number(price),
      category: category.trim(),
      brand: brand || "",
      stock: Number(stock ?? 0),

      imageUrl: mainImage,
      imagePublicId: uploadedIds[0] || "",
      imagePublicIds: uploadedIds,
      images: finalImages,

      colors: finalColors,
      variants: finalVariants,
      specifications: finalSpecifications,
      highlights: finalHighlights,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET ALL PRODUCTS
// GET /api/products
// ==========================================

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET PRODUCT BY ID
// GET /api/products/:id
// ==========================================

const getProductById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE PRODUCT
// PUT /api/products/:id
// ==========================================

const updateProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const files = getUploadedFiles(req);

    const fieldError = validateUploadFields(files);
    if (fieldError) {
      return res.status(400).json({ success: false, message: fieldError });
    }

    const imageError = validateImages(files);
    if (imageError) {
      return res.status(400).json({ success: false, message: imageError });
    }

    // Store old IDs so removed images can be deleted after saving.
    const oldPublicIds = getAllPublicIds(product);

    // BASIC FIELDS

    if (req.body.name !== undefined) {
      if (!String(req.body.name).trim()) {
        return res.status(400).json({
          success: false,
          message: "Product name cannot be empty.",
        });
      }

      product.name = String(req.body.name).trim();
    }

    if (req.body.description !== undefined) {
      product.description = req.body.description;
    }

    if (req.body.category !== undefined) {
      if (!String(req.body.category).trim()) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be empty.",
        });
      }

      product.category = String(req.body.category).trim();
    }

    if (req.body.brand !== undefined) {
      product.brand = req.body.brand;
    }

    if (req.body.price !== undefined) {
      const price = Number(req.body.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid product price.",
        });
      }

      product.price = price;
    }

    if (req.body.stock !== undefined) {
      const stock = Number(req.body.stock);

      if (!Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid product stock.",
        });
      }

      product.stock = stock;
    }

    // GENERAL IMAGES

    const generalFiles = getGeneralFiles(files);
    const uploadedGeneralUrls = getFileUrls(generalFiles);
    const uploadedGeneralIds = getFilePublicIds(generalFiles);

    if (
      req.body.images !== undefined ||
      req.body.imageUrl !== undefined ||
      uploadedGeneralUrls.length > 0
    ) {
      const submittedImages =
        req.body.images !== undefined
          ? parseArray(req.body.images)
          : product.images || [];

      const mainImage =
        req.body.imageUrl !== undefined
          ? String(req.body.imageUrl || "")
          : product.imageUrl || "";

      product.images = uniqueImages([
        ...(mainImage ? [mainImage] : []),
        ...submittedImages,
        ...uploadedGeneralUrls,
      ]).slice(0, 20);

      product.imageUrl = product.images[0] || "";

      const retainedIds =
        req.body.imagePublicIds !== undefined
          ? parseArray(req.body.imagePublicIds)
          : product.imagePublicIds || [];

      product.imagePublicIds = [
        ...new Set([...retainedIds, ...uploadedGeneralIds]),
      ];

      product.imagePublicId = product.imagePublicIds[0] || "";
    } else if (req.body.imagePublicIds !== undefined) {
      product.imagePublicIds = parseArray(req.body.imagePublicIds);
      product.imagePublicId = product.imagePublicIds[0] || "";
    }

    // COLOURS

    const colorFiles = getColorFiles(files);

    if (req.body.colors !== undefined || colorFiles.length > 0) {
      const submittedColors =
        req.body.colors !== undefined
          ? parseArray(req.body.colors)
          : (product.colors || []).map((color) =>
              color.toObject ? color.toObject() : color,
            );

      let updatedColors = prepareColors(submittedColors, product.colors || []);

      updatedColors = attachColorUploads(updatedColors, files);

      const colorError = validateColors(updatedColors);
      if (colorError) {
        return res.status(400).json({ success: false, message: colorError });
      }

      // An empty images array is allowed; it removes all images for that colour.
      product.colors = updatedColors;
    }

    // VARIANTS
    // An empty array removes all variants.

    if (req.body.variants !== undefined) {
      const updatedVariants = normalizeVariants(parseArray(req.body.variants));

      const variantError = validateVariants(updatedVariants);
      if (variantError) {
        return res.status(400).json({
          success: false,
          message: variantError,
        });
      }

      product.variants = updatedVariants;
    }

    // SPECIFICATIONS
    // An empty array removes all specifications.

    if (req.body.specifications !== undefined) {
      product.specifications = normalizeSpecifications(
        parseArray(req.body.specifications),
      );
    }

    // HIGHLIGHTS
    // An empty array removes all highlights.

    if (req.body.highlights !== undefined) {
      product.highlights = normalizeHighlights(parseArray(req.body.highlights));
    }

    // MAIN IMAGE FALLBACK

    if (!product.imageUrl) {
      const firstColorImage = (product.colors || []).find(
        (color) => color.images?.length > 0,
      )?.images[0];

      product.imageUrl = firstColorImage || "";
    }

    // SAVE TO MONGODB

    await product.save();

    // DELETE REMOVED CLOUDINARY IMAGES

    const newPublicIds = getAllPublicIds(product);

    const removedPublicIds = oldPublicIds.filter(
      (id) => !newPublicIds.includes(id),
    );

    await deleteCloudinaryImages(removedPublicIds);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: product,
      removedImages: removedPublicIds.length,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// DELETE PRODUCT
// DELETE /api/products/:id
// ==========================================

const deleteProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const publicIds = getAllPublicIds(product);

    await Product.findByIdAndDelete(req.params.id);

    await deleteCloudinaryImages(publicIds);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
