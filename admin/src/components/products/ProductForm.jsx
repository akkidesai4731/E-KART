import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/axios.js";
import {
  Upload,
  X,
  Package,
  Plus,
  Loader2,
  Palette,
  Layers,
  Trash2,
  ImagePlus,
  FileText,
  Star,
  ArrowLeft,
} from "lucide-react";

// ==========================================
// HELPERS
// ==========================================

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100";

const labelClass = "mb-2 block text-sm font-semibold text-gray-700";

const initialForm = {
  name: "",
  brand: "",
  category: "",
  price: "",
  originalPrice: "",
  stock: "",
  description: "",
};

const createColor = () => ({
  id: makeId(),
  _id: "",
  name: "",
  colorCode: "#cccccc",
  stock: "0",
  images: [],
  imagePublicIds: [],
  newFiles: [],
});

const createVariantOption = () => ({
  id: makeId(),
  _id: "",
  value: "",
  price: "",
  originalPrice: "",
  stock: "0",
  sku: "",
});

const createVariantGroup = () => ({
  id: makeId(),
  _id: "",
  name: "",
  options: [createVariantOption()],
});

const createSpecification = () => ({
  id: makeId(),
  name: "",
  value: "",
});

const createHighlight = () => ({
  id: makeId(),
  icon: "check",
  title: "",
});

// ==========================================
// IMAGE PREVIEW
// ==========================================

const getPreview = (file) => URL.createObjectURL(file);

// ==========================================
// PRODUCT FORM
// ==========================================

const ProductForm = () => {
  const { id, productId } = useParams();
  const navigate = useNavigate();

  const editId = id || productId;
  const isEdit = Boolean(editId);

  // ==========================================
  // STATES
  // ==========================================

  const [formData, setFormData] = useState(initialForm);

  // Existing and new general images
  const [existingImages, setExistingImages] = useState([]);
  const [existingImagePublicIds, setExistingImagePublicIds] = useState([]);
  const [newImages, setNewImages] = useState([]);

  // Colours
  const [colors, setColors] = useState([]);

  // Variants
  const [variants, setVariants] = useState([]);

  // Specifications
  const [specifications, setSpecifications] = useState([]);

  // Highlights
  const [highlights, setHighlights] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // LOAD EXISTING PRODUCT
  // ==========================================

  useEffect(() => {
    if (!isEdit) return;

    const loadProduct = async () => {
      try {
        setFetching(true);
        setError("");

        const response = await api.get(`/products/${editId}`);

        const product = response.data?.data;

        if (!product) {
          throw new Error("Product not found.");
        }

        setFormData({
          name: product.name || "",
          brand: product.brand || "",
          category: product.category || "",
          price: product.price ?? "",
          originalPrice: product.originalPrice ?? "",
          stock: product.stock ?? 0,
          description: product.description || "",
        });

        // GENERAL IMAGES

        const gallery = [
          ...new Set(
            [product.imageUrl, ...(product.images || [])].filter(Boolean),
          ),
        ];

        setExistingImages(gallery);

        setExistingImagePublicIds(
          product.imagePublicIds?.length
            ? product.imagePublicIds
            : product.imagePublicId
              ? [product.imagePublicId]
              : [],
        );

        // COLOURS

        setColors(
          (product.colors || []).map((color) => ({
            id: makeId(),
            _id: color._id || "",
            name: color.name || "",
            colorCode: color.colorCode || "#cccccc",
            stock: String(color.stock ?? 0),
            images: color.images?.length
              ? color.images
              : color.imageUrl
                ? [color.imageUrl]
                : [],
            imagePublicIds: color.imagePublicIds?.length
              ? color.imagePublicIds
              : color.imagePublicId
                ? [color.imagePublicId]
                : [],
            newFiles: [],
          })),
        );

        // VARIANTS

        setVariants(
          (product.variants || []).map((variant) => ({
            id: makeId(),
            _id: variant._id || "",
            name: variant.name || "",
            options: (variant.options || []).map((option) => ({
              id: makeId(),
              _id: option._id || "",
              value: option.value || "",
              price: option.price ?? "",
              originalPrice: option.originalPrice ?? "",
              stock: String(option.stock ?? 0),
              sku: option.sku || "",
            })),
          })),
        );

        // SPECIFICATIONS

        setSpecifications(
          (product.specifications || []).map((item) => ({
            id: makeId(),
            name: item.name || "",
            value: item.value || "",
          })),
        );

        // HIGHLIGHTS

        setHighlights(
          (product.highlights || []).map((item) => ({
            id: makeId(),
            icon: item.icon || "check",
            title: item.title || "",
          })),
        );
      } catch (err) {
        console.error("LOAD PRODUCT ERROR:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load product.",
        );
      } finally {
        setFetching(false);
      }
    };

    loadProduct();
  }, [editId, isEdit]);

  // ==========================================
  // BASIC FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // IMAGE VALIDATION
  // ==========================================

  const validateImage = (file) => {
    if (!file) return "Please select an image.";

    if (!file.type.startsWith("image/")) {
      return "Please select a valid image.";
    }

    if (file.size > 10 * 1024 * 1024) {
      return "Image size must be less than 10 MB.";
    }

    return "";
  };

  // ==========================================
  // GENERAL PRODUCT IMAGES
  // ==========================================

  const handleGeneralImages = (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    for (const file of files) {
      const validation = validateImage(file);

      if (validation) {
        setError(validation);
        e.target.value = "";
        return;
      }
    }

    if (existingImages.length + newImages.length + files.length > 20) {
      setError("Maximum 20 product images are allowed.");
      e.target.value = "";
      return;
    }

    setError("");

    setNewImages((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: makeId(),
        file,
        preview: getPreview(file),
      })),
    ]);

    e.target.value = "";
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (id) => {
    setNewImages((prev) => {
      const item = prev.find((image) => image.id === id);

      if (item) URL.revokeObjectURL(item.preview);

      return prev.filter((image) => image.id !== id);
    });
  };

  // ==========================================
  // COLOURS
  // ==========================================

  const addColor = () => {
    setColors((prev) => [...prev, createColor()]);
  };

  const updateColor = (id, field, value) => {
    setColors((prev) =>
      prev.map((color) =>
        color.id === id ? { ...color, [field]: value } : color,
      ),
    );
  };

  const addColorImages = (id, e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    for (const file of files) {
      const validation = validateImage(file);

      if (validation) {
        setError(validation);
        e.target.value = "";
        return;
      }
    }

    const color = colors.find((item) => item.id === id);

    if (
      color &&
      color.images.length + color.newFiles.length + files.length > 10
    ) {
      setError("Maximum 10 images per colour are allowed.");
      e.target.value = "";
      return;
    }

    setError("");

    setColors((prev) =>
      prev.map((color) =>
        color.id === id
          ? {
              ...color,
              newFiles: [
                ...color.newFiles,
                ...files.map((file) => ({
                  id: makeId(),
                  file,
                  preview: getPreview(file),
                })),
              ],
            }
          : color,
      ),
    );

    e.target.value = "";
  };

  const removeColorImage = (colorId, imageIndex) => {
    setColors((prev) =>
      prev.map((color) =>
        color.id === colorId
          ? {
              ...color,
              images: color.images.filter((_, i) => i !== imageIndex),
              imagePublicIds: color.imagePublicIds.filter(
                (_, i) => i !== imageIndex,
              ),
            }
          : color,
      ),
    );
  };

  const removeNewColorImage = (colorId, fileId) => {
    setColors((prev) =>
      prev.map((color) => {
        if (color.id !== colorId) return color;

        const item = color.newFiles.find((file) => file.id === fileId);

        if (item) URL.revokeObjectURL(item.preview);

        return {
          ...color,
          newFiles: color.newFiles.filter((file) => file.id !== fileId),
        };
      }),
    );
  };

  const removeColor = (id) => {
    setColors((prev) => {
      const color = prev.find((item) => item.id === id);

      color?.newFiles.forEach((file) => URL.revokeObjectURL(file.preview));

      return prev.filter((color) => color.id !== id);
    });
  };

  // ==========================================
  // VARIANTS
  // ==========================================

  const addVariantGroup = () => {
    setVariants((prev) => [...prev, createVariantGroup()]);
  };

  const updateVariantGroup = (id, value) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === id ? { ...variant, name: value } : variant,
      ),
    );
  };

  const addVariantOption = (groupId) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === groupId
          ? {
              ...variant,
              options: [...variant.options, createVariantOption()],
            }
          : variant,
      ),
    );
  };

  const updateVariantOption = (groupId, optionId, field, value) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === groupId
          ? {
              ...variant,
              options: variant.options.map((option) =>
                option.id === optionId ? { ...option, [field]: value } : option,
              ),
            }
          : variant,
      ),
    );
  };

  const removeVariantOption = (groupId, optionId) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === groupId
          ? {
              ...variant,
              options: variant.options.filter(
                (option) => option.id !== optionId,
              ),
            }
          : variant,
      ),
    );
  };

  const removeVariantGroup = (groupId) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== groupId));
  };

  // ==========================================
  // SPECIFICATIONS
  // ==========================================

  const addSpecification = () => {
    setSpecifications((prev) => [...prev, createSpecification()]);
  };

  const updateSpecification = (id, field, value) => {
    setSpecifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeSpecification = (id) => {
    setSpecifications((prev) => prev.filter((item) => item.id !== id));
  };

  // ==========================================
  // HIGHLIGHTS
  // ==========================================

  const addHighlight = () => {
    setHighlights((prev) => [...prev, createHighlight()]);
  };

  const updateHighlight = (id, field, value) => {
    setHighlights((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeHighlight = (id) => {
    setHighlights((prev) => prev.filter((item) => item.id !== id));
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    if (isEdit) return;

    newImages.forEach((image) => URL.revokeObjectURL(image.preview));

    colors.forEach((color) =>
      color.newFiles.forEach((file) => URL.revokeObjectURL(file.preview)),
    );

    setFormData(initialForm);
    setExistingImages([]);
    setExistingImagePublicIds([]);
    setNewImages([]);
    setColors([]);
    setVariants([]);
    setSpecifications([]);
    setHighlights([]);
    setError("");
    setSuccess("");
  };

  // ==========================================
  // VALIDATION
  // ==========================================

  const validateForm = () => {
    if (
      !formData.name.trim() ||
      !formData.category.trim() ||
      formData.price === "" ||
      formData.stock === "" ||
      !formData.description.trim()
    ) {
      return "Please fill in all required fields.";
    }

    if (
      !Number.isFinite(Number(formData.price)) ||
      Number(formData.price) <= 0 ||
      !Number.isInteger(Number(formData.stock)) ||
      Number(formData.stock) < 0
    ) {
      return "Enter a valid product price and stock quantity.";
    }

    if (
      formData.originalPrice !== "" &&
      (!Number.isFinite(Number(formData.originalPrice)) ||
        Number(formData.originalPrice) < Number(formData.price))
    ) {
      return "Original price must be greater than or equal to selling price.";
    }

    if (existingImages.length + newImages.length === 0) {
      return "Please add at least one product image.";
    }

    if (colors.length > 10) {
      return "Maximum 10 colours are allowed.";
    }

    const colorNames = colors.map((color) => color.name.trim().toLowerCase());

    if (
      colorNames.some((name) => !name) ||
      new Set(colorNames).size !== colorNames.length
    ) {
      return "Enter unique names for all colours.";
    }

    for (const color of colors) {
      if (!Number.isInteger(Number(color.stock)) || Number(color.stock) < 0) {
        return `Enter valid stock for ${color.name}.`;
      }
    }

    for (const variant of variants) {
      if (!variant.name.trim()) {
        return "Please enter a name for every variant group.";
      }

      if (!variant.options.length) {
        return `Add at least one option to ${variant.name}.`;
      }

      for (const option of variant.options) {
        if (
          !option.value.trim() ||
          option.price === "" ||
          option.stock === ""
        ) {
          return `Complete all required fields in ${variant.name}.`;
        }

        if (
          !Number.isFinite(Number(option.price)) ||
          Number(option.price) < 0 ||
          !Number.isInteger(Number(option.stock)) ||
          Number(option.stock) < 0
        ) {
          return `Check price and stock in ${variant.name}.`;
        }

        if (
          option.originalPrice !== "" &&
          (!Number.isFinite(Number(option.originalPrice)) ||
            Number(option.originalPrice) < Number(option.price))
        ) {
          return `MRP must be at least the selling price in ${variant.name}.`;
        }
      }
    }

    for (const item of specifications) {
      if (!item.name.trim() || !item.value.trim()) {
        return "Complete or remove empty specifications.";
      }
    }

    for (const item of highlights) {
      if (!item.title.trim()) {
        return "Complete or remove empty highlights.";
      }
    }

    if (highlights.length > 30) {
      return "Maximum 30 highlights are allowed.";
    }

    return "";
  };

  // ==========================================
  // SUBMIT PRODUCT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const productData = new FormData();

      // BASIC INFORMATION

      productData.append("name", formData.name.trim());
      productData.append("brand", formData.brand.trim());
      productData.append("category", formData.category.trim());
      productData.append("price", Number(formData.price));
      productData.append("stock", Number(formData.stock));
      productData.append("description", formData.description.trim());

      if (formData.originalPrice !== "") {
        productData.append("originalPrice", Number(formData.originalPrice));
      }

      // GENERAL IMAGES
      // Existing URLs are retained; removed ones are omitted.
      // New files are uploaded using the "images" field.

      const allImageUrls = [
        ...existingImages,
        ...newImages.map((item) => item.preview),
      ];

      // Send only URLs that already exist on the server.
      productData.append("images", JSON.stringify(existingImages));

      productData.append("imageUrl", existingImages[0] || "");

      productData.append(
        "imagePublicIds",
        JSON.stringify(existingImagePublicIds.slice(0, existingImages.length)),
      );

      newImages.forEach((item) => {
        productData.append("images", item.file);
      });

      // COLOURS

      const colorPayload = colors.map((color, index) => {
        color.newFiles.forEach((item) => {
          productData.append(`colorImages_${index}`, item.file);
        });

        return {
          _id: color._id || undefined,
          name: color.name.trim(),
          colorCode: color.colorCode,
          stock: Number(color.stock),
          images: color.images,
          imagePublicIds: color.imagePublicIds,
        };
      });

      productData.append("colors", JSON.stringify(colorPayload));

      // VARIANTS

      const variantPayload = variants.map((variant) => ({
        _id: variant._id || undefined,
        name: variant.name.trim(),

        options: variant.options.map((option) => ({
          _id: option._id || undefined,
          value: option.value.trim(),
          price: Number(option.price),

          originalPrice:
            option.originalPrice === ""
              ? undefined
              : Number(option.originalPrice),

          stock: Number(option.stock),
          sku: option.sku || "",
        })),
      }));

      productData.append("variants", JSON.stringify(variantPayload));

      // SPECIFICATIONS

      productData.append(
        "specifications",
        JSON.stringify(
          specifications.map((item) => ({
            name: item.name.trim(),
            value: item.value.trim(),
          })),
        ),
      );

      // HIGHLIGHTS

      productData.append(
        "highlights",
        JSON.stringify(
          highlights.map((item) => ({
            icon: item.icon || "check",
            title: item.title.trim(),
          })),
        ),
      );

      // API REQUEST

      const response = isEdit
        ? await api.put(`/products/${editId}`, productData)
        : await api.post("/products", productData);

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Unable to save product.");
      }

      setSuccess(
        isEdit
          ? "Product updated successfully!"
          : "Product added successfully!",
      );

      if (!isEdit) {
        resetForm();
      }
    } catch (err) {
      console.error("PRODUCT SAVE ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong while saving the product.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCHING SCREEN
  // ==========================================

  if (fetching) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-red-600" />
        <span className="text-gray-600">Loading product...</span>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="mx-auto w-full max-w-5xl rounded-xl bg-white p-5 shadow-md sm:p-8">
      {/* HEADER */}

      <div className="mb-7 flex flex-wrap items-center gap-3">
        <div className="rounded-lg bg-red-100 p-3">
          <Package className="h-6 w-6 text-red-600" />
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h2>

          <p className="text-sm text-gray-500">
            Manage product details, images, colours and variants.
          </p>
        </div>

        {isEdit && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={17} />
            Back
          </button>
        )}
      </div>

      {/* MESSAGES */}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* BASIC INFORMATION */}

        <section className="space-y-5">
          <h3 className="border-b pb-3 text-lg font-bold text-gray-900">
            Basic Product Information
          </h3>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Product Name *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="Product name"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Brand</label>
              <input
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className={inputClass}
                placeholder="Brand name"
              />
            </div>

            <div>
              <label className={labelClass}>Category *</label>
              <input
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={inputClass}
                placeholder="Mobiles, Laptops, etc."
                required
              />
            </div>

            <div>
              <label className={labelClass}>Selling Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Original Price / MRP (₹)</label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="Optional"
              />
            </div>

            <div>
              <label className={labelClass}>Base Stock *</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                step="1"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className={inputClass}
              placeholder="Product description"
              required
            />
          </div>
        </section>

        {/* GENERAL PRODUCT IMAGES */}

        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Product Gallery</h3>
            <p className="text-sm text-gray-500">
              Add up to 20 general product images.
            </p>
          </div>

          <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 text-center hover:border-red-400">
            <Upload className="mb-2 h-8 w-8 text-gray-400" />
            <span className="font-medium text-gray-700">
              Click to upload product images
            </span>
            <span className="text-xs text-gray-400">
              JPG, PNG or WEBP — maximum 10 MB each
            </span>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGeneralImages}
              className="hidden"
            />
          </label>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {existingImages.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="relative rounded-lg border p-2"
              >
                <img
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="h-32 w-full rounded object-contain"
                />

                <span className="mt-1 block text-xs text-gray-500">
                  Existing image
                </span>

                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white"
                  title="Remove image"
                >
                  <X size={15} />
                </button>
              </div>
            ))}

            {newImages.map((image) => (
              <div key={image.id} className="relative rounded-lg border p-2">
                <img
                  src={image.preview}
                  alt="New product"
                  className="h-32 w-full rounded object-contain"
                />

                <span className="mt-1 block text-xs text-green-600">
                  New image
                </span>

                <button
                  type="button"
                  onClick={() => removeNewImage(image.id)}
                  className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* COLOURS */}

        <section className="space-y-5 rounded-xl border border-gray-200 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <Palette className="h-6 w-6 text-purple-600" />
              <div>
                <h3 className="text-lg font-bold">Product Colours</h3>
                <p className="text-xs text-gray-500">
                  Manage colour names, stock and images.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addColor}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={17} />
              Add Color
            </button>
          </div>

          {colors.map((color, index) => (
            <div
              key={color.id}
              className="space-y-4 rounded-xl border bg-gray-50 p-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold">Color {index + 1}</h4>

                <button
                  type="button"
                  onClick={() => removeColor(color.id)}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Color Name *</label>
                  <input
                    value={color.name}
                    onChange={(e) =>
                      updateColor(color.id, "name", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Cosmic Purple"
                  />
                </div>

                <div>
                  <label className={labelClass}>Color Code</label>
                  <input
                    type="color"
                    value={color.colorCode}
                    onChange={(e) =>
                      updateColor(color.id, "colorCode", e.target.value)
                    }
                    className="h-12 w-full cursor-pointer rounded-lg border p-1"
                  />
                </div>

                <div>
                  <label className={labelClass}>Color Stock *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={color.stock}
                    onChange={(e) =>
                      updateColor(color.id, "stock", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-white p-4 text-sm font-medium text-gray-600 hover:border-purple-400">
                <ImagePlus size={19} />
                Add images for {color.name || "this colour"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addColorImages(color.id, e)}
                />
              </label>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {color.images.map((image, imageIndex) => (
                  <div
                    key={`${image}-${imageIndex}`}
                    className="relative rounded-lg border bg-white p-2"
                  >
                    <img
                      src={image}
                      alt={color.name}
                      className="h-28 w-full object-contain"
                    />

                    <span className="text-xs text-gray-500">
                      Existing image
                    </span>

                    <button
                      type="button"
                      onClick={() => removeColorImage(color.id, imageIndex)}
                      className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {color.newFiles.map((file) => (
                  <div
                    key={file.id}
                    className="relative rounded-lg border bg-white p-2"
                  >
                    <img
                      src={file.preview}
                      alt={color.name}
                      className="h-28 w-full object-contain"
                    />

                    <span className="text-xs text-green-600">New image</span>

                    <button
                      type="button"
                      onClick={() => removeNewColorImage(color.id, file.id)}
                      className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {colors.length === 0 && (
            <p className="rounded-lg bg-gray-50 p-5 text-center text-sm text-gray-500">
              No colour options added.
            </p>
          )}
        </section>

        {/* VARIANTS */}

        <section className="space-y-5 rounded-xl border border-gray-200 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <Layers className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-bold">Product Variants</h3>
                <p className="text-xs text-gray-500">
                  Manage RAM, storage, size, capacity and prices.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addVariantGroup}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={17} />
              Add Variant
            </button>
          </div>

          {variants.map((variant, index) => (
            <div
              key={variant.id}
              className="space-y-4 rounded-xl border bg-gray-50 p-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold">Variant Group {index + 1}</h4>

                <button
                  type="button"
                  onClick={() => removeVariantGroup(variant.id)}
                  className="text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <input
                value={variant.name}
                onChange={(e) => updateVariantGroup(variant.id, e.target.value)}
                className={inputClass}
                placeholder="e.g. RAM & Storage"
              />

              {variant.options.map((option, optionIndex) => (
                <div
                  key={option.id}
                  className="space-y-4 rounded-lg border bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold">Option {optionIndex + 1}</h5>

                    <button
                      type="button"
                      disabled={variant.options.length === 1}
                      onClick={() => removeVariantOption(variant.id, option.id)}
                      className="text-red-600 disabled:opacity-30"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Option Name *</label>
                      <input
                        value={option.value}
                        onChange={(e) =>
                          updateVariantOption(
                            variant.id,
                            option.id,
                            "value",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                        placeholder="128GB + 8GB RAM"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Selling Price *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={option.price}
                        onChange={(e) =>
                          updateVariantOption(
                            variant.id,
                            option.id,
                            "price",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Original Price / MRP</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={option.originalPrice}
                        onChange={(e) =>
                          updateVariantOption(
                            variant.id,
                            option.id,
                            "originalPrice",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Stock *</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={option.stock}
                        onChange={(e) =>
                          updateVariantOption(
                            variant.id,
                            option.id,
                            "stock",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>SKU</label>
                      <input
                        value={option.sku}
                        onChange={(e) =>
                          updateVariantOption(
                            variant.id,
                            option.id,
                            "sku",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                        placeholder="Optional SKU"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addVariantOption(variant.id)}
                className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
              >
                <Plus size={17} />
                Add Option
              </button>
            </div>
          ))}

          {variants.length === 0 && (
            <p className="rounded-lg bg-gray-50 p-5 text-center text-sm text-gray-500">
              No variants added.
            </p>
          )}
        </section>

        {/* SPECIFICATIONS */}

        <section className="space-y-4 rounded-xl border p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-bold">Specifications</h3>
            </div>

            <button
              type="button"
              onClick={addSpecification}
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={17} />
              Add Specification
            </button>
          </div>

          {specifications.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-1 items-end gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <label className={labelClass}>Specification Name</label>
                <input
                  value={item.name}
                  onChange={(e) =>
                    updateSpecification(item.id, "name", e.target.value)
                  }
                  className={inputClass}
                  placeholder="Display"
                />
              </div>

              <div>
                <label className={labelClass}>Value</label>
                <input
                  value={item.value}
                  onChange={(e) =>
                    updateSpecification(item.id, "value", e.target.value)
                  }
                  className={inputClass}
                  placeholder="6.7 inch AMOLED"
                />
              </div>

              <button
                type="button"
                onClick={() => removeSpecification(item.id)}
                className="rounded-lg p-3 text-red-600 hover:bg-red-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {specifications.length === 0 && (
            <p className="text-sm text-gray-500">No specifications added.</p>
          )}
        </section>

        {/* HIGHLIGHTS */}

        <section className="space-y-4 rounded-xl border p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <h3 className="text-lg font-bold">Product Highlights</h3>
            </div>

            <button
              type="button"
              onClick={addHighlight}
              className="flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={17} />
              Add Highlight
            </button>
          </div>

          {highlights.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-1 items-end gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-[1fr_2fr_auto]"
            >
              <div>
                <label className={labelClass}>Icon Name</label>
                <input
                  value={item.icon}
                  onChange={(e) =>
                    updateHighlight(item.id, "icon", e.target.value)
                  }
                  className={inputClass}
                  placeholder="check"
                />
              </div>

              <div>
                <label className={labelClass}>Highlight</label>
                <input
                  value={item.title}
                  onChange={(e) =>
                    updateHighlight(item.id, "title", e.target.value)
                  }
                  className={inputClass}
                  placeholder="Fast charging support"
                />
              </div>

              <button
                type="button"
                onClick={() => removeHighlight(item.id)}
                className="rounded-lg p-3 text-red-600 hover:bg-red-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {highlights.length === 0 && (
            <p className="text-sm text-gray-500">No highlights added.</p>
          )}
        </section>

        {/* SUBMIT */}

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row">
          <button
            type="submit"
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving Product...
              </>
            ) : (
              <>
                <Package className="h-5 w-5" />
                {isEdit ? "Update Product" : "Add Product"}
              </>
            )}
          </button>

          {!isEdit && (
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-100"
            >
              Reset Form
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
