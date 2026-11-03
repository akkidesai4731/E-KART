import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  ImagePlus,
  Save,
  LoaderCircle,
  RotateCcw,
  Palette,
  Package,
  X,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

// ==========================================
// API CONFIGURATION
// ==========================================

const RAW_API_URL =
  import.meta.env.VITE_API_URL || "http://192.168.1.102:8000/api";

const NORMALIZED_API_URL = RAW_API_URL.replace(/\/+$/, "");

const API_BASE_URL = NORMALIZED_API_URL.endsWith("/api")
  ? NORMALIZED_API_URL
  : `${NORMALIZED_API_URL}/api`;

const API = `${API_BASE_URL}/products`;
const CATEGORY_API = `${API_BASE_URL}/categories`;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES_PER_COLOR = 10;
const MAX_COLORS = 10;
const MAX_HIGHLIGHTS = 30;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const inputClass =
  "mt-1 w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100";

const initialForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  brand: "",
  stock: "",
  specifications: [{ name: "", value: "" }],
};

const initialColor = () => ({
  name: "",
  colorCode: "#000000",
  images: [],
  imagePublicIds: [],
  files: [],
});

const initialVariant = () => ({
  name: "",
  options: [{ value: "", price: "", stock: "", sku: "" }],
});

const initialHighlight = () => ({
  icon: "check",
  title: "",
});

// ==========================================
// API RESPONSE HELPER
// ==========================================

async function readApiResponse(response) {
  const text = await response.text();

  let result = {};

  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Invalid server response (${response.status}).`);
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message ||
        result.error ||
        `Request failed with status ${response.status}`,
    );
  }

  return result;
}

// Supports different common backend response structures.
function getProductFromResponse(result) {
  return result?.product || result?.data?.product || result?.data || result;
}

function getImageUrl(image) {
  if (typeof image === "string") return image;

  return image?.url || image?.imageUrl || image?.secure_url || "";
}

function getImagePublicId(image) {
  if (typeof image === "object" && image !== null) {
    return image.publicId || image.public_id || image.imagePublicId || "";
  }

  return "";
}

function normalizeColor(color) {
  const sourceImages = Array.isArray(color.images) ? color.images : [];

  const images = sourceImages
    .map((image) => getImageUrl(image))
    .filter(Boolean);

  const publicIds =
    Array.isArray(color.imagePublicIds) && color.imagePublicIds.length
      ? color.imagePublicIds
      : sourceImages.map(getImagePublicId);

  return {
    name: color.name || "",
    colorCode: color.colorCode || "#000000",
    images,
    imagePublicIds: publicIds,
    files: [],
  };
}

function normalizeProduct(product) {
  const specifications = Array.isArray(product.specifications)
    ? product.specifications.map((item) => ({
        name: item.name || "",
        value: item.value || "",
      }))
    : [];

  const colors = Array.isArray(product.colors)
    ? product.colors.map(normalizeColor)
    : [];

  const variants = Array.isArray(product.variants)
    ? product.variants.map((variant) => ({
        name: variant.name || "",
        options: Array.isArray(variant.options)
          ? variant.options.map((option) => ({
              value: option.value || "",
              price: option.price ?? "",
              stock: option.stock ?? "",
              sku: option.sku || "",
            }))
          : [],
      }))
    : [];

  const highlights = Array.isArray(product.highlights)
    ? product.highlights.map((item) => ({
        icon: item.icon || "check",
        title: item.title || "",
      }))
    : [];

  return {
    form: {
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      category:
        typeof product.category === "object"
          ? product.category?.name || ""
          : product.category || "",
      brand: product.brand || "",
      stock: product.stock ?? "",
      specifications:
        specifications.length > 0 ? specifications : [{ name: "", value: "" }],
    },
    colors: colors.length > 0 ? colors : [initialColor()],
    variants,
    highlights: highlights.length > 0 ? highlights : [initialHighlight()],
  };
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function AddProduct() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    ...initialForm,
    specifications: [{ name: "", value: "" }],
  });

  const [colors, setColors] = useState([initialColor()]);
  const [variants, setVariants] = useState([]);
  const [highlights, setHighlights] = useState([initialHighlight()]);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [imageErrors, setImageErrors] = useState([]);

  // ==========================================
  // IMAGE PREVIEWS
  // ==========================================

  const colorPreviews = useMemo(
    () =>
      colors.map((color) => {
        const existing = (color.images || []).map((url, index) => ({
          type: "existing",
          url,
          index,
          name: `Existing image ${index + 1}`,
        }));

        const newlySelected = (color.files || []).map((file, index) => ({
          type: "new",
          url: URL.createObjectURL(file),
          index,
          name: file.name,
        }));

        return [...existing, ...newlySelected];
      }),
    [colors],
  );

  useEffect(() => {
    return () => {
      colorPreviews.forEach((previews) => {
        previews.forEach((preview) => {
          if (preview.type === "new") {
            URL.revokeObjectURL(preview.url);
          }
        });
      });
    };
  }, [colorPreviews]);

  // ==========================================
  // MESSAGES
  // ==========================================

  const clearMessages = () => {
    setMessage("");
    setError("");
    setImageErrors([]);
  };

  // ==========================================
  // LOAD CATEGORIES
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    const loadCategories = async () => {
      try {
        setLoadingCategories(true);

        const response = await fetch(CATEGORY_API, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        const result = await readApiResponse(response);

        const list = Array.isArray(result)
          ? result
          : Array.isArray(result.categories)
            ? result.categories
            : Array.isArray(result.data)
              ? result.data
              : Array.isArray(result.data?.categories)
                ? result.data.categories
                : [];

        setCategories(list.filter((category) => category.isActive !== false));
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(`Could not load categories: ${err.message}`);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCategories(false);
        }
      }
    };

    loadCategories();

    return () => controller.abort();
  }, []);

  // ==========================================
  // LOAD EXISTING PRODUCT FOR EDITING
  // ==========================================

  useEffect(() => {
    if (!isEditMode) return;

    const controller = new AbortController();

    const loadProduct = async () => {
      try {
        setLoadingProduct(true);
        setError("");

        const response = await fetch(`${API}/${id}`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        const result = await readApiResponse(response);
        const product = getProductFromResponse(result);

        if (!product || !(product._id || product.id)) {
          throw new Error(
            "Product details were not found in the API response.",
          );
        }

        const normalized = normalizeProduct(product);

        setForm(normalized.form);
        setColors(normalized.colors);
        setVariants(normalized.variants);
        setHighlights(normalized.highlights);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("LOAD PRODUCT ERROR:", err);
          setError(`Could not load product: ${err.message}`);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProduct(false);
        }
      }
    };

    loadProduct();

    return () => controller.abort();
  }, [id, isEditMode]);

  // ==========================================
  // BASIC INFORMATION
  // ==========================================

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearMessages();
  };

  // ==========================================
  // COLOUR MANAGEMENT
  // ==========================================

  const addColor = () => {
    if (colors.length >= MAX_COLORS) {
      setError(`Maximum ${MAX_COLORS} colours are allowed.`);
      return;
    }

    setColors((prev) => [...prev, initialColor()]);
    clearMessages();
  };

  const removeColor = (index) => {
    setColors((prev) => prev.filter((_, i) => i !== index));
    clearMessages();
  };

  const updateColor = (index, field, value) => {
    setColors((prev) =>
      prev.map((color, i) =>
        i === index ? { ...color, [field]: value } : color,
      ),
    );

    clearMessages();
  };

  // ==========================================
  // COLOUR IMAGE UPLOAD / REMOVE
  // ==========================================

  const handleColorImages = (index, event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const currentColor = colors[index];

    if (!currentColor) return;

    const currentCount = currentColor.images.length + currentColor.files.length;

    const validFiles = [...currentColor.files];
    const errors = [];

    for (const file of selectedFiles) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Only JPG, PNG and WebP are allowed.`);
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        errors.push(`${file.name}: Maximum image size is 5 MB.`);
        continue;
      }

      if (
        currentCount + validFiles.length - currentColor.files.length >=
        MAX_IMAGES_PER_COLOR
      ) {
        errors.push(
          `Maximum ${MAX_IMAGES_PER_COLOR} images per colour are allowed.`,
        );
        break;
      }

      validFiles.push(file);
    }

    setColors((prev) =>
      prev.map((color, i) =>
        i === index ? { ...color, files: validFiles } : color,
      ),
    );

    setImageErrors(errors);
    setMessage("");
    setError("");
    event.target.value = "";
  };

  const removeColorImage = (colorIndex, preview) => {
    setColors((prev) =>
      prev.map((color, i) => {
        if (i !== colorIndex) return color;

        if (preview.type === "existing") {
          const imageIndex = preview.index;

          return {
            ...color,
            images: color.images.filter((_, j) => j !== imageIndex),
            imagePublicIds: color.imagePublicIds.filter(
              (_, j) => j !== imageIndex,
            ),
          };
        }

        return {
          ...color,
          files: color.files.filter((_, j) => j !== preview.index),
        };
      }),
    );

    clearMessages();
  };

  // ==========================================
  // VARIANTS
  // ==========================================

  const addVariant = () => {
    setVariants((prev) => [...prev, initialVariant()]);
    clearMessages();
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
    clearMessages();
  };

  const updateVariantName = (index, value) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, name: value } : variant,
      ),
    );

    clearMessages();
  };

  const addVariantOption = (variantIndex) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === variantIndex
          ? {
              ...variant,
              options: [
                ...variant.options,
                { value: "", price: "", stock: "", sku: "" },
              ],
            }
          : variant,
      ),
    );

    clearMessages();
  };

  const removeVariantOption = (variantIndex, optionIndex) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === variantIndex
          ? {
              ...variant,
              options: variant.options.filter((_, j) => j !== optionIndex),
            }
          : variant,
      ),
    );

    clearMessages();
  };

  const updateVariantOption = (variantIndex, optionIndex, field, value) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === variantIndex
          ? {
              ...variant,
              options: variant.options.map((option, j) =>
                j === optionIndex ? { ...option, [field]: value } : option,
              ),
            }
          : variant,
      ),
    );

    clearMessages();
  };

  // ==========================================
  // SPECIFICATIONS
  // ==========================================

  const updateSpec = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) =>
        i === index ? { ...spec, [field]: value } : spec,
      ),
    }));

    clearMessages();
  };

  const addSpecification = () => {
    setForm((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { name: "", value: "" }],
    }));

    clearMessages();
  };

  const removeSpecification = (index) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));

    clearMessages();
  };

  // ==========================================
  // HIGHLIGHTS
  // ==========================================

  const addHighlight = () => {
    if (highlights.length >= MAX_HIGHLIGHTS) {
      setError(`Maximum ${MAX_HIGHLIGHTS} highlights are allowed.`);
      return;
    }

    setHighlights((prev) => [...prev, initialHighlight()]);
    clearMessages();
  };

  const updateHighlight = (index, field, value) => {
    setHighlights((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );

    clearMessages();
  };

  const removeHighlight = (index) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
    clearMessages();
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setForm({
      ...initialForm,
      specifications: [{ name: "", value: "" }],
    });

    setColors([initialColor()]);
    setVariants([]);
    setHighlights([initialHighlight()]);
    clearMessages();
  };

  // ==========================================
  // VALIDATION
  // ==========================================

  const validateForm = () => {
    if (!form.name.trim()) return "Please enter the product name.";
    if (!form.category.trim()) return "Please select a category.";

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      return "Please enter a valid product price.";
    }

    if (
      form.stock === "" ||
      !Number.isInteger(Number(form.stock)) ||
      Number(form.stock) < 0
    ) {
      return "Please enter a valid whole-number stock quantity.";
    }

    if (colors.length === 0) {
      return "Please add at least one product colour.";
    }

    const colorNames = colors.map((color) => color.name.trim().toLowerCase());

    if (colorNames.some((name) => !name)) {
      return "Please enter a name for every product colour.";
    }

    if (new Set(colorNames).size !== colorNames.length) {
      return "Duplicate product colours are not allowed.";
    }

    for (const color of colors) {
      if (color.images.length + color.files.length === 0) {
        return `Please add at least one image for ${color.name}.`;
      }
    }

    const variantNames = variants.map((variant) =>
      variant.name.trim().toLowerCase(),
    );

    if (
      variantNames.some((name) => !name) ||
      new Set(variantNames).size !== variantNames.length
    ) {
      return "Enter a unique name for every product variant.";
    }

    for (const variant of variants) {
      if (variant.options.length === 0) {
        return `Please add at least one option for ${variant.name}.`;
      }

      for (const option of variant.options) {
        if (!option.value.trim()) {
          return `Please enter an option value for ${variant.name}.`;
        }

        if (
          option.price === "" ||
          !Number.isFinite(Number(option.price)) ||
          Number(option.price) < 0
        ) {
          return `Please enter a valid price for ${option.value}.`;
        }

        if (
          option.stock === "" ||
          !Number.isInteger(Number(option.stock)) ||
          Number(option.stock) < 0
        ) {
          return `Please enter valid stock for ${option.value}.`;
        }
      }
    }

    const incompleteSpec = form.specifications.some(
      (spec) =>
        (spec.name.trim() && !spec.value.trim()) ||
        (!spec.name.trim() && spec.value.trim()),
    );

    if (incompleteSpec) {
      return "Complete both the name and value of each specification.";
    }

    return null;
  };

  // ==========================================
  // SAVE PRODUCT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearMessages();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const productData = new FormData();

    // BASIC DETAILS

    productData.append("name", form.name.trim());
    productData.append("description", form.description.trim());
    productData.append("price", String(Number(form.price)));
    productData.append("category", form.category);
    productData.append("brand", form.brand.trim());
    productData.append("stock", String(Number(form.stock)));

    // COLOURS
    // Keep existing Cloudinary URLs and public IDs.
    // Newly uploaded files are sent separately.

    const colorsData = colors.map((color) => ({
      name: color.name.trim(),
      colorCode: color.colorCode,
      images: color.images,
      imagePublicIds: color.imagePublicIds,
    }));

    productData.append("colors", JSON.stringify(colorsData));

    // NEW COLOUR IMAGES

    colors.forEach((color, index) => {
      color.files.forEach((file) => {
        productData.append(`colorImages_${index}`, file);
      });
    });

    // VARIANTS

    const variantsData = variants.map((variant) => ({
      name: variant.name.trim(),
      options: variant.options.map((option) => ({
        value: option.value.trim(),
        price: Number(option.price),
        stock: Number(option.stock),
        sku: option.sku.trim(),
      })),
    }));

    productData.append("variants", JSON.stringify(variantsData));

    // SPECIFICATIONS

    const specifications = form.specifications
      .filter((spec) => spec.name.trim() && spec.value.trim())
      .map((spec) => ({
        name: spec.name.trim(),
        value: spec.value.trim(),
      }));

    productData.append("specifications", JSON.stringify(specifications));

    // HIGHLIGHTS

    const highlightsData = highlights
      .filter((item) => item.title.trim())
      .map((item) => ({
        icon: item.icon || "check",
        title: item.title.trim(),
      }));

    productData.append("highlights", JSON.stringify(highlightsData));

    setLoading(true);

    try {
      const url = isEditMode ? `${API}/${id}` : API;

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        body: productData,
      });

      const result = await readApiResponse(response);

      console.log("PRODUCT SAVE RESPONSE:", result);

      setMessage(
        isEditMode
          ? "Product updated successfully!"
          : "Product added successfully!",
      );

      if (!isEditMode) {
        resetForm();
      } else {
        // Reload the saved product so the form shows the latest Cloudinary URLs.
        const refreshedResponse = await fetch(`${API}/${id}`, {
          headers: { Accept: "application/json" },
        });

        const refreshedResult = await readApiResponse(refreshedResponse);
        const refreshedProduct = getProductFromResponse(refreshedResult);
        const normalized = normalizeProduct(refreshedProduct);

        setForm(normalized.form);
        setColors(normalized.colors);
        setVariants(normalized.variants);
        setHighlights(normalized.highlights);
      }
    } catch (err) {
      console.error("PRODUCT SAVE ERROR:", err);

      setError(
        `${err.message}. Check your backend product update controller and image upload middleware.`,
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loadingProduct) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoaderCircle
            size={35}
            className="mx-auto animate-spin text-red-600"
          />
          <p className="mt-3 text-sm text-gray-600">
            Loading existing product...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Edit Existing Product" : "Add New Product"}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage product details, images, colours, variants, specifications
              and highlights.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-100"
            >
              <ArrowLeft size={16} />
              Back to Products
            </button>

            <button
              type="button"
              onClick={resetForm}
              disabled={loading || isEditMode}
              title={
                isEditMode
                  ? "Reset is disabled while editing an existing product"
                  : "Reset form"
              }
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-100 disabled:opacity-40"
            >
              <RotateCcw size={16} />
              Reset Form
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-7 rounded-2xl border bg-white p-5 shadow-sm sm:p-8"
        >
          {/* MESSAGES */}

          {message && (
            <div
              role="status"
              className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
            >
              {message}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="break-words rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* BASIC INFORMATION */}

          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Basic Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Product Name *
                <input
                  required
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Apple iPhone"
                />
              </label>

              <label className="text-sm font-medium">
                Brand
                <input
                  className={inputClass}
                  value={form.brand}
                  onChange={(e) => updateField("brand", e.target.value)}
                  placeholder="e.g. Apple"
                />
              </label>

              <label className="text-sm font-medium">
                Category *
                <select
                  required
                  className={inputClass}
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : "Select Category"}
                  </option>

                  {categories.map((category) => {
                    const categoryId = category._id || category.id;
                    const name =
                      category.name || category.title || category.category;

                    if (!name) return null;

                    return (
                      <option key={categoryId || name} value={name}>
                        {name}
                      </option>
                    );
                  })}

                  {form.category &&
                    !categories.some(
                      (category) =>
                        (category.name ||
                          category.title ||
                          category.category) === form.category,
                    ) && (
                      <option value={form.category}>
                        {form.category} (Current category)
                      </option>
                    )}
                </select>
              </label>

              <label className="text-sm font-medium">
                Base Price (₹) *
                <input
                  required
                  min="0"
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                />
              </label>

              <label className="text-sm font-medium sm:col-span-2">
                Overall Stock Quantity *
                <input
                  required
                  min="0"
                  step="1"
                  type="number"
                  className={inputClass}
                  value={form.stock}
                  onChange={(e) => updateField("stock", e.target.value)}
                />
              </label>

              <label className="text-sm font-medium sm:col-span-2">
                Description
                <textarea
                  rows={4}
                  maxLength={1000}
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe product features..."
                />
              </label>
            </div>
          </section>

          {/* HIGHLIGHTS */}

          <section className="border-t pt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Sparkles size={20} className="text-red-600" />
                  Product Highlights
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add, edit or remove product features.
                </p>
              </div>

              <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                {highlights.length} / {MAX_HIGHLIGHTS}
              </span>
            </div>

            <div className="space-y-3">
              {highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 items-end gap-3 rounded-xl border bg-gray-50 p-3 sm:grid-cols-[150px_1fr_auto]"
                >
                  <label className="text-sm font-medium">
                    Select Icon
                    <select
                      value={highlight.icon}
                      onChange={(e) =>
                        updateHighlight(index, "icon", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="check">General</option>
                      <option value="memory">Storage / Memory</option>
                      <option value="cpu">Processor</option>
                      <option value="camera">Rear Camera</option>
                      <option value="camera-front">Front Camera</option>
                      <option value="smartphone">Display / Screen</option>
                      <option value="battery">Battery</option>
                      <option value="wifi">Connectivity</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium">
                    Highlight Text
                    <input
                      maxLength={150}
                      value={highlight.title}
                      onChange={(e) =>
                        updateHighlight(index, "title", e.target.value)
                      }
                      placeholder="Example: 512 GB ROM"
                      className={inputClass}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => removeHighlight(index)}
                    disabled={loading}
                    className="flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addHighlight}
              disabled={loading || highlights.length >= MAX_HIGHLIGHTS}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-red-400 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Plus size={18} />
              Add Product Highlight
            </button>
          </section>

          {/* COLOURS AND IMAGES */}

          <section className="border-t pt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Palette size={20} className="text-red-600" />
                  Product Colours & Images
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Keep existing images, upload new ones or remove images.
                </p>
              </div>

              <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                {colors.length} / {MAX_COLORS} Colours
              </span>
            </div>

            <div className="space-y-5">
              {colors.map((color, colorIndex) => (
                <div
                  key={colorIndex}
                  className="rounded-xl border bg-gray-50 p-4 sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-800">
                      Colour {colorIndex + 1}
                    </h3>

                    <button
                      type="button"
                      onClick={() => removeColor(colorIndex)}
                      disabled={loading}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Remove Colour
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                    <label className="text-sm font-medium">
                      Colour Name *
                      <input
                        required
                        className={inputClass}
                        value={color.name}
                        onChange={(e) =>
                          updateColor(colorIndex, "name", e.target.value)
                        }
                        placeholder="e.g. Black, Blue, Burgundy"
                      />
                    </label>

                    <label className="text-sm font-medium">
                      Colour Code
                      <div className="mt-1 flex h-11 items-center gap-2 rounded-lg border bg-white px-2">
                        <input
                          type="color"
                          value={color.colorCode || "#000000"}
                          onChange={(e) =>
                            updateColor(colorIndex, "colorCode", e.target.value)
                          }
                          className="h-8 w-10 cursor-pointer"
                        />
                        <span className="text-xs text-gray-600">
                          {color.colorCode}
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="mt-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {color.name || "Product"} Images
                        </p>
                        <p className="text-xs text-gray-500">
                          Existing images and newly selected images.
                        </p>
                      </div>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600">
                        {color.images.length + color.files.length} /{" "}
                        {MAX_IMAGES_PER_COLOR}
                      </span>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                      <ImagePlus size={17} />
                      Upload More Images
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        disabled={
                          loading ||
                          color.images.length + color.files.length >=
                            MAX_IMAGES_PER_COLOR
                        }
                        onChange={(e) => handleColorImages(colorIndex, e)}
                        className="sr-only"
                      />
                    </label>

                    {imageErrors.length > 0 && (
                      <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                        {imageErrors.map((item, index) => (
                          <p key={index}>{item}</p>
                        ))}
                      </div>
                    )}

                    {colorPreviews[colorIndex]?.length > 0 ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {colorPreviews[colorIndex].map((preview) => (
                          <div
                            key={`${preview.type}-${preview.index}`}
                            className="overflow-hidden rounded-xl border bg-white"
                          >
                            <div className="flex h-32 items-center justify-center p-2">
                              <img
                                src={preview.url}
                                alt={`${color.name} image`}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>

                            <div className="flex items-center justify-between gap-1 border-t p-2">
                              <div className="min-w-0">
                                <span
                                  className={`text-xs font-semibold ${
                                    preview.type === "existing"
                                      ? "text-green-700"
                                      : "text-blue-700"
                                  }`}
                                >
                                  {preview.type === "existing"
                                    ? "Saved Image"
                                    : "New Image"}
                                </span>
                                <p className="truncate text-xs text-gray-500">
                                  {preview.name}
                                </p>
                              </div>

                              <button
                                type="button"
                                disabled={loading}
                                onClick={() =>
                                  removeColorImage(colorIndex, preview)
                                }
                                className="shrink-0 rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                aria-label="Remove image"
                              >
                                <X size={17} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed bg-white p-6 text-center text-sm text-gray-400">
                        <ImagePlus size={28} className="mx-auto mb-2" />
                        No images uploaded for this colour.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addColor}
              disabled={loading || colors.length >= MAX_COLORS}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-red-400 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Plus size={18} />
              Add Another Colour
            </button>
          </section>

          {/* VARIANTS */}

          <section className="border-t pt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Package size={20} className="text-red-600" />
                  Product Variants
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Edit, add or remove storage, RAM, size and other options.
                </p>
              </div>

              <button
                type="button"
                onClick={addVariant}
                disabled={loading}
                className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                <Plus size={17} />
                Add Variant
              </button>
            </div>

            {variants.length === 0 && (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-400">
                No variants added.
              </div>
            )}

            <div className="space-y-5">
              {variants.map((variant, variantIndex) => (
                <div key={variantIndex} className="rounded-xl border p-4">
                  <div className="mb-4 flex items-end gap-3">
                    <label className="flex-1 text-sm font-medium">
                      Variant Name *
                      <input
                        required
                        className={inputClass}
                        value={variant.name}
                        onChange={(e) =>
                          updateVariantName(variantIndex, e.target.value)
                        }
                        placeholder="e.g. Storage, RAM, Size"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => removeVariant(variantIndex)}
                      disabled={loading}
                      className="mb-0.5 rounded-lg p-3 text-red-600 hover:bg-red-50"
                      aria-label="Remove variant"
                    >
                      <Trash2 size={19} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {variant.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="rounded-lg bg-gray-50 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600">
                            Option {optionIndex + 1}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removeVariantOption(variantIndex, optionIndex)
                            }
                            className="text-red-600"
                            aria-label="Remove option"
                          >
                            <X size={17} />
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-xs font-medium">
                            Option Value *
                            <input
                              required
                              className={inputClass}
                              value={option.value}
                              onChange={(e) =>
                                updateVariantOption(
                                  variantIndex,
                                  optionIndex,
                                  "value",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g. 512 GB"
                            />
                          </label>

                          <label className="text-xs font-medium">
                            Price (₹) *
                            <input
                              required
                              type="number"
                              min="0"
                              step="0.01"
                              className={inputClass}
                              value={option.price}
                              onChange={(e) =>
                                updateVariantOption(
                                  variantIndex,
                                  optionIndex,
                                  "price",
                                  e.target.value,
                                )
                              }
                              placeholder="Enter price"
                            />
                          </label>

                          <label className="text-xs font-medium">
                            Stock Quantity *
                            <input
                              required
                              type="number"
                              min="0"
                              step="1"
                              className={inputClass}
                              value={option.stock}
                              onChange={(e) =>
                                updateVariantOption(
                                  variantIndex,
                                  optionIndex,
                                  "stock",
                                  e.target.value,
                                )
                              }
                              placeholder="Enter stock"
                            />
                          </label>

                          <label className="text-xs font-medium">
                            SKU (Optional)
                            <input
                              className={inputClass}
                              value={option.sku}
                              onChange={(e) =>
                                updateVariantOption(
                                  variantIndex,
                                  optionIndex,
                                  "sku",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g. IP-512"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addVariantOption(variantIndex)}
                    disabled={loading}
                    className="mt-3 flex items-center gap-1 text-sm font-semibold text-red-600"
                  >
                    <Plus size={16} />
                    Add Option
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* SPECIFICATIONS */}

          <section className="border-t pt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Product Specifications</h2>

              <button
                type="button"
                onClick={addSpecification}
                disabled={loading}
                className="flex items-center gap-1 text-sm font-semibold text-red-600"
              >
                <Plus size={17} />
                Add Specification
              </button>
            </div>

            {form.specifications.map((spec, index) => (
              <div
                key={index}
                className="mb-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  className={inputClass}
                  placeholder="Specification (e.g. RAM)"
                  value={spec.name}
                  onChange={(e) => updateSpec(index, "name", e.target.value)}
                />

                <input
                  className={inputClass}
                  placeholder="Value (e.g. 12 GB)"
                  value={spec.value}
                  onChange={(e) => updateSpec(index, "value", e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => removeSpecification(index)}
                  disabled={loading}
                  className="rounded-lg p-3 text-red-600 hover:bg-red-50"
                  aria-label="Remove specification"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </section>

          {/* SAVE */}

          <div className="border-t pt-6">
            <button
              type="submit"
              disabled={loading || loadingCategories}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={19} className="animate-spin" />
                  {isEditMode ? "Updating Product..." : "Uploading Product..."}
                </>
              ) : (
                <>
                  <Save size={19} />
                  {isEditMode ? "Save Product Changes" : "Save Product"}
                </>
              )}
            </button>

            <p className="mt-3 text-center text-xs text-gray-500">
              Existing images are retained unless removed. New images are sent
              to your backend for Cloudinary upload. Product details and nested
              contents are saved in MongoDB.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
