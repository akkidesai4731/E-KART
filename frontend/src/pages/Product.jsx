import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import ProductReviews from "../components/product/ProductReviews";
import ProductGallery from "../components/product/ProductGallery";

import {
  ShoppingCart,
  Zap,
  ShieldCheck,
  Truck,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Cpu,
  HardDrive,
  Camera,
  Smartphone,
  Battery,
  Monitor,
  Wifi,
  MemoryStick,
  Package,
  Settings,
  Clock,
  Gauge,
} from "lucide-react";

// ==========================================
// API CONFIGURATION
// ==========================================

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://e-kart-2ijq.onrender.com/api"
).replace(/\/+$/, "");

const API_URL = API_BASE_URL.endsWith("/api")
  ? `${API_BASE_URL}/products`
  : `${API_BASE_URL}/api/products`;

// ==========================================
// IMAGE HELPERS
// ==========================================

function getImageUrl(image) {
  if (typeof image === "string") return image.trim();

  if (image && typeof image === "object") {
    return image.url || image.imageUrl || image.secure_url || image.path || "";
  }

  return "";
}

function getProductImages(product) {
  if (!product) return [];

  const images = [
    product.imageUrl,
    product.image,
    product.thumbnail,
    ...(Array.isArray(product.images) ? product.images : []),
  ];

  return [...new Set(images.map(getImageUrl).filter(Boolean))];
}

function getColorImages(color) {
  if (!color) return [];

  const images = [
    ...(Array.isArray(color.images) ? color.images : []),
    color.imageUrl,
    color.image,
  ];

  return [...new Set(images.map(getImageUrl).filter(Boolean))];
}

function getColorImage(color) {
  return getColorImages(color)[0] || "";
}

// ==========================================
// GENERAL HELPERS
// ==========================================

function formatPrice(price) {
  return Number(price || 0).toLocaleString("en-IN");
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Not specified";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function getHighlightIcon(highlight) {
  const value =
    `${highlight?.title || ""} ${highlight?.icon || ""}`.toLowerCase();

  if (/ram|memory/.test(value)) return MemoryStick;
  if (/rom|storage|gb|tb/.test(value)) return HardDrive;
  if (/processor|chip|cpu|core/.test(value)) return Cpu;
  if (/camera|mp/.test(value)) return Camera;
  if (/display|screen|inch|amoled|oled/.test(value)) return Monitor;
  if (/battery|mah|charging/.test(value)) return Battery;
  if (/phone|mobile|smartphone/.test(value)) return Smartphone;
  if (/wifi|bluetooth|network|connectivity/.test(value)) return Wifi;
  if (/speed|performance|rpm/.test(value)) return Gauge;
  if (/warranty|support|protection/.test(value)) return ShieldCheck;
  if (/time|duration/.test(value)) return Clock;
  if (/package|box/.test(value)) return Package;
  if (/setting|feature/.test(value)) return Settings;

  return Check;
}

// ==========================================
// DYNAMIC STORAGE
// ==========================================

function getSelectedStorage(selectedVariantOptions) {
  for (const item of selectedVariantOptions) {
    const groupName = String(item.groupName || "").toLowerCase();
    const value = String(item.option?.value || "").trim();

    if (!value) continue;

    const markedStorage = value.match(
      /(\d+(?:\.\d+)?\s*(?:TB|GB|MB))\s*(?:ROM|storage)/i,
    );

    if (markedStorage) {
      return markedStorage[1].replace(/\s+/g, " ").trim();
    }

    if (/storage|rom/.test(groupName)) {
      const capacity = value.match(/(\d+(?:\.\d+)?\s*(?:TB|GB|MB))/i);

      return capacity ? capacity[1].replace(/\s+/g, " ").trim() : value;
    }

    if (/\b\d+(?:\.\d+)?\s*(?:TB|GB|MB)\b/i.test(value)) {
      const capacities = value.match(/\d+(?:\.\d+)?\s*(?:TB|GB|MB)/gi);

      if (capacities?.length) {
        return capacities[capacities.length - 1].replace(/\s+/g, " ").trim();
      }
    }
  }

  return "";
}

function getDynamicHighlights(productHighlights, selectedStorage) {
  const highlights = Array.isArray(productHighlights)
    ? productHighlights.filter(
        (item) => item && String(item.title || "").trim(),
      )
    : [];

  if (!selectedStorage) return highlights;

  return highlights.map((highlight) => {
    const originalTitle = String(highlight.title || "");

    const isStorageHighlight =
      /storage|rom/i.test(originalTitle) ||
      /\b\d+(?:\.\d+)?\s*(?:TB|GB|MB)\b/i.test(originalTitle);

    if (!isStorageHighlight) return highlight;

    let updatedTitle = originalTitle.replace(
      /\d+(?:\.\d+)?\s*(?:TB|GB|MB)/i,
      selectedStorage,
    );

    if (!/\d+(?:\.\d+)?\s*(?:TB|GB|MB)/i.test(originalTitle)) {
      updatedTitle = `${selectedStorage} ${originalTitle}`;
    }

    return { ...highlight, title: updatedTitle };
  });
}

// ==========================================
// DYNAMIC PRODUCT TITLE
// ==========================================

function getDynamicProductTitle(productName, color, selectedVariants) {
  const baseName = productName || "Product";
  const colorName = color?.name?.trim();

  const values = selectedVariants
    .filter((item) => item.option?.value)
    .map((item) => ({
      groupName: String(item.groupName || "").toLowerCase(),
      value: String(item.option.value).trim(),
    }));

  let storage = "";
  let ram = "";
  const otherVariants = [];

  values.forEach(({ groupName, value }) => {
    if (value.includes("+")) {
      const parts = value.split("+").map((part) => part.trim());

      if (parts.length === 2) {
        const firstCapacity = parts[0].match(/\d+(?:\.\d+)?\s*(?:TB|GB|MB)/i);

        const secondCapacity = parts[1].match(/\d+(?:\.\d+)?\s*(?:TB|GB|MB)/i);

        if (/storage|rom/.test(groupName)) {
          storage = value;
        } else if (/ram|memory/.test(groupName)) {
          ram = value;
        } else {
          storage = secondCapacity?.[0] || firstCapacity?.[0] || "";
          ram = firstCapacity?.[0] || "";
        }

        return;
      }
    }

    if (/storage|rom/.test(groupName)) {
      storage = value;
    } else if (/ram|memory/.test(groupName)) {
      ram = /ram/i.test(value) ? value : `${value} RAM`;
    } else {
      otherVariants.push(value);
    }
  });

  const titleParts = [];

  if (colorName) titleParts.push(colorName);
  if (storage) titleParts.push(storage);
  if (ram) titleParts.push(ram);

  titleParts.push(...otherVariants);

  return titleParts.length
    ? `${baseName} (${titleParts.join(", ")})`
    : baseName;
}

// ==========================================
// PRODUCT COMPONENT
// ==========================================

export default function Product() {
  const { id } = useParams();

  const { addToCart } = useCart();
  const { isLoggedIn } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeImage, setActiveImage] = useState("");
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});

  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartMessageType, setCartMessageType] = useState("success");

  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [highlightsOpen, setHighlightsOpen] = useState(true);

  // ==========================================
  // FETCH PRODUCT
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");
        setProduct(null);

        const response = await fetch(`${API_URL}/${id}`, {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Product not found."
              : `Unable to load product (${response.status}).`,
          );
        }

        const result = await response.json();
        const found = result.data || result.product || result;

        if (!found || !(found._id || found.id)) {
          throw new Error("Invalid product information received.");
        }

        setProduct(found);
        setSelectedColor(0);
        setActiveImage(getProductImages(found)[0] || "");

        const initialSelections = {};

        if (Array.isArray(found.variants)) {
          found.variants.forEach((variant, index) => {
            const options = Array.isArray(variant.options)
              ? variant.options
              : [];

            const availableIndex = options.findIndex(
              (option) =>
                option.stock === undefined ||
                option.stock === null ||
                Number(option.stock) > 0,
            );

            initialSelections[index] = availableIndex >= 0 ? availableIndex : 0;
          });
        }

        setSelectedOptions(initialSelections);
        setCartMessage("");
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Product loading error:", err);
          setError(err.message || "Unable to load product.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      fetchProduct();
    } else {
      setError("Product ID is missing.");
      setLoading(false);
    }

    return () => controller.abort();
  }, [id]);

  // ==========================================
  // COLORS AND VARIANTS
  // ==========================================

  const colors = useMemo(
    () => (Array.isArray(product?.colors) ? product.colors : []),
    [product],
  );

  const currentColor = colors[selectedColor] || null;

  const variants = useMemo(
    () => (Array.isArray(product?.variants) ? product.variants : []),
    [product],
  );

  const selectedVariantOptions = useMemo(() => {
    return variants.map((variant, index) => {
      const options = Array.isArray(variant.options) ? variant.options : [];

      const selectedIndex = selectedOptions[index] ?? 0;

      return {
        groupName: variant.name || "Variant",
        option: options[selectedIndex] || null,
      };
    });
  }, [variants, selectedOptions]);

  const purchaseOption = [...selectedVariantOptions]
    .reverse()
    .find((item) => item.option?.price !== undefined)?.option;

  // ==========================================
  // PRODUCT IMAGES
  // ==========================================

  const images = useMemo(() => {
    const colorImages = getColorImages(currentColor);

    return colorImages.length ? colorImages : getProductImages(product);
  }, [product, currentColor]);

  useEffect(() => {
    setActiveImage(images[0] || "");
  }, [images]);

  // SHOW UP TO 10 IMAGES
  const galleryImages = useMemo(() => {
    if (!images.length) return [];

    return [activeImage, ...images.filter((image) => image !== activeImage)]
      .filter(Boolean)
      .slice(0, 10);
  }, [images, activeImage]);

  // ==========================================
  // DYNAMIC PRODUCT NAME AND HIGHLIGHTS
  // ==========================================

  const selectedProductName = useMemo(
    () =>
      getDynamicProductTitle(
        product?.name,
        currentColor,
        selectedVariantOptions,
      ),
    [product?.name, currentColor, selectedVariantOptions],
  );

  const selectedStorage = useMemo(
    () => getSelectedStorage(selectedVariantOptions),
    [selectedVariantOptions],
  );

  const highlights = useMemo(
    () => getDynamicHighlights(product?.highlights, selectedStorage),
    [product?.highlights, selectedStorage],
  );

  // ==========================================
  // PRICE AND STOCK
  // ==========================================

  const price = Number(purchaseOption?.price ?? product?.price ?? 0);

  const originalPrice = Number(
    purchaseOption?.originalPrice ??
      purchaseOption?.originalprice ??
      product?.originalPrice ??
      product?.mrp ??
      product?.compareAtPrice ??
      0,
  );

  const discount =
    originalPrice > price && originalPrice > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const stock = Number(
    purchaseOption?.stock ?? currentColor?.stock ?? product?.stock ?? 0,
  );

  const outOfStock = stock <= 0;

  // ==========================================
  // SELECT COLOR AND VARIANT
  // ==========================================

  function handleColorChange(index) {
    if (index < 0 || index >= colors.length) return;

    setSelectedColor(index);
    setCartMessage("");

    const selectedColorImages = getColorImages(colors[index]);

    if (selectedColorImages.length > 0) {
      setActiveImage(selectedColorImages[0]);
    }
  }

  function handleVariantChange(variantIndex, optionIndex) {
    setSelectedOptions((previous) => ({
      ...previous,
      [variantIndex]: optionIndex,
    }));

    setCartMessage("");
  }

  // ==========================================
  // PREPARE CART PRODUCT
  // ==========================================

  function addCurrentProductToCart() {
    if (!product) {
      return {
        success: false,
        message: "Product details are unavailable.",
      };
    }

    if (outOfStock) {
      return {
        success: false,
        message: "This product is currently out of stock.",
      };
    }

    const productId = product._id || product.id;

    if (!productId) {
      return {
        success: false,
        message: "Product ID is missing.",
      };
    }

    const selectedVariantsForCart = selectedVariantOptions
      .filter((item) => item.option)
      .map((item) => ({
        name: item.groupName,
        value: item.option.value,
        price: Number(item.option.price ?? price),
        stock: Number(item.option.stock ?? stock),
        sku: item.option.sku || "",
      }));

    const cartProduct = {
      ...product,
      _id: String(productId),
      id: String(productId),
      name: selectedProductName,
      price,
      originalPrice,
      stock,

      selectedColor: currentColor
        ? {
            _id: currentColor._id,
            name: currentColor.name,
            colorCode: currentColor.colorCode || "",
          }
        : null,

      selectedVariants: selectedVariantsForCart,
      selectedVariant: selectedVariantsForCart[0] || null,

      cartImage: activeImage || images[0] || product.imageUrl || product.image,
    };

    const result = addToCart(cartProduct);

    if (result?.success === false) {
      return {
        success: false,
        message: result.message || "Unable to add product.",
      };
    }

    return { success: true };
  }

  // ==========================================
  // ADD TO CART
  // ==========================================

  function handleAddToCart() {
    if (!product || addingToCart) return;

    setCartMessage("");

    if (!isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }

    setAddingToCart(true);

    try {
      const result = addCurrentProductToCart();

      if (!result.success) {
        setCartMessageType("error");
        setCartMessage(result.message);
        return;
      }

      setCartMessageType("success");
      setCartMessage("Product added to cart successfully!");
    } catch (err) {
      console.error("Add to cart error:", err);
      setCartMessageType("error");
      setCartMessage(err.message || "Unable to add product to cart.");
    } finally {
      setAddingToCart(false);
    }
  }

  // ==========================================
  // BUY NOW
  // ==========================================

  function handleBuyNow() {
    if (!product || addingToCart) return;

    setCartMessage("");

    if (!isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }

    setAddingToCart(true);

    try {
      const result = addCurrentProductToCart();

      if (!result.success) {
        setCartMessageType("error");
        setCartMessage(result.message);
        return;
      }

      navigate("/checkout");
    } catch (err) {
      console.error("Buy Now error:", err);
      setCartMessageType("error");
      setCartMessage(err.message || "Unable to proceed to checkout.");
    } finally {
      setAddingToCart(false);
    }
  }

  function handleLoginNow() {
    setShowLoginPopup(false);

    navigate("/login", {
      state: {
        from: location.pathname + location.search,
      },
    });
  }

  // ==========================================
  // LOADING AND ERROR
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-20 text-center">
        <h2 className="mb-3 text-xl font-bold text-red-600">{error}</h2>
        <Link to="/shop" className="font-semibold text-red-600 underline">
          Return to Shop
        </Link>
      </div>
    );
  }

  if (!product) return null;

  // ==========================================
  // SPECIFICATIONS AND EXTRA DETAILS
  // ==========================================

  const specifications = Array.isArray(product.specifications)
    ? product.specifications
    : [];

  const excludedFields = new Set([
    "_id",
    "id",
    "__v",
    "createdAt",
    "updatedAt",
    "image",
    "imageUrl",
    "thumbnail",
    "images",
    "imagePublicId",
    "imagePublicIds",
    "colors",
    "variants",
    "specifications",
    "highlights",
    "password",
    "isActive",
    "stock",
    "price",
    "originalPrice",
    "name",
    "description",
    "category",
    "brand",
    "rating",
    "numReviews",
  ]);

  const extraDetails = Object.entries(product).filter(
    ([key, value]) =>
      !excludedFields.has(key) &&
      value !== null &&
      value !== undefined &&
      typeof value !== "function",
  );

  // ==========================================
  // PRODUCT PAGE UI
  // ==========================================

  return (
    <main className="min-h-screen w-full bg-[#f1f3f6] px-3 py-4 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        {/* BREADCRUMB */}

        <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:text-sm">
          <Link to="/" className="hover:text-red-600">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-red-600">
            Shop
          </Link>
          <span>/</span>
          <span className="text-gray-700">
            {typeof product.category === "object"
              ? product.category?.name
              : product.category || "Products"}
          </span>
        </nav>

        {/* MAIN PRODUCT LAYOUT */}

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:gap-6">
          {/* LEFT: IMAGE GALLERY */}

          <section className="min-w-0 rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:p-5 lg:sticky lg:top-20 lg:self-start">
            <ProductGallery
              images={galleryImages}
              activeImage={activeImage}
              onImageSelect={setActiveImage}
              productName={selectedProductName}
            />
          </section>

          {/* RIGHT: PRODUCT DETAILS */}

          <section className="min-w-0 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:p-7">
            {/* BRAND */}

            {product.brand && (
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-600">
                {product.brand}
              </p>
            )}

            {/* PRODUCT NAME */}

            <h1 className="break-words text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
              {selectedProductName}
            </h1>

            {/* RATING */}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded bg-green-700 px-2 py-1 font-semibold text-white">
                {Number(product.rating || 0).toFixed(1)} ★
              </span>

              <span className="text-gray-500">
                {Number(product.numReviews || 0).toLocaleString("en-IN")}{" "}
                ratings & reviews
              </span>
            </div>

            {/* PRICE */}

            <div className="mt-5 rounded-lg bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Price
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl font-bold tracking-tight text-gray-900">
                  ₹{formatPrice(price)}
                </span>

                {originalPrice > price && (
                  <span className="text-lg text-gray-400 line-through">
                    ₹{formatPrice(originalPrice)}
                  </span>
                )}

                {discount > 0 && (
                  <span className="rounded bg-green-50 px-2 py-1 text-sm font-bold text-green-700">
                    {discount}% OFF
                  </span>
                )}
              </div>

              {discount > 0 && (
                <p className="mt-1 text-sm font-medium text-green-700">
                  You save ₹{formatPrice(originalPrice - price)}
                </p>
              )}
            </div>

            {/* COLOR SELECTION */}

            {colors.length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Choose Color
                  </h3>

                  <span className="text-sm font-medium text-gray-600">
                    {currentColor?.name || "Select a color"}
                  </span>
                </div>

                <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2">
                  {colors.map((color, index) => {
                    const optionImage = getColorImage(color);
                    const isSelected = selectedColor === index;

                    return (
                      <button
                        key={color._id || `${color.name}-${index}`}
                        type="button"
                        onClick={() => handleColorChange(index)}
                        title={color.name || "Product color"}
                        aria-label={`Select ${color.name || "product color"}`}
                        aria-pressed={isSelected}
                        className={`group flex w-[76px] shrink-0 flex-col items-center gap-2 rounded-lg border p-2 transition ${
                          isSelected
                            ? "border-red-600 bg-red-50 ring-1 ring-red-600"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
                          {optionImage ? (
                            <img
                              src={optionImage}
                              alt={color.name || "Product color"}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span
                              className="h-full w-full"
                              style={{
                                backgroundColor: color.colorCode || "#e5e7eb",
                              }}
                            />
                          )}
                        </span>

                        <span className="w-full truncate text-center text-[11px] font-medium text-gray-700">
                          {color.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VARIANT SELECTION */}

            {variants.map((variant, variantIndex) => {
              const options = Array.isArray(variant.options)
                ? variant.options
                : [];

              const selectedIndex = selectedOptions[variantIndex] ?? 0;

              return (
                <div
                  key={variant._id || `${variant.name}-${variantIndex}`}
                  className="mt-6 border-t border-gray-100 pt-5"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Select {variant.name || "Variant"}
                    </h3>

                    <span className="text-sm font-medium text-gray-600">
                      {options[selectedIndex]?.value || "Select option"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {options.map((option, optionIndex) => {
                      const isSelected = selectedIndex === optionIndex;

                      const optionOutOfStock =
                        option.stock !== undefined &&
                        option.stock !== null &&
                        Number(option.stock) <= 0;

                      const optionPrice = Number(option.price ?? price);
                      const optionOriginalPrice = Number(
                        option.originalPrice ?? 0,
                      );

                      const optionDiscount =
                        optionOriginalPrice > optionPrice &&
                        optionOriginalPrice > 0
                          ? Math.round(
                              ((optionOriginalPrice - optionPrice) /
                                optionOriginalPrice) *
                                100,
                            )
                          : 0;

                      return (
                        <button
                          key={option._id || `${option.value}-${optionIndex}`}
                          type="button"
                          onClick={() =>
                            handleVariantChange(variantIndex, optionIndex)
                          }
                          disabled={optionOutOfStock}
                          aria-pressed={isSelected}
                          className={`min-w-0 rounded-lg border p-3 text-left transition ${
                            isSelected
                              ? "border-red-600 bg-red-50 ring-1 ring-red-600"
                              : "border-gray-200 bg-white hover:border-gray-400"
                          } disabled:cursor-not-allowed disabled:opacity-40`}
                        >
                          <span className="block break-words text-sm font-semibold text-gray-800">
                            {option.value}
                          </span>

                          <span className="mt-2 block text-sm font-bold text-gray-900">
                            ₹{formatPrice(optionPrice)}
                          </span>

                          {optionOriginalPrice > optionPrice && (
                            <span className="mt-1 block text-xs text-gray-400 line-through">
                              ₹{formatPrice(optionOriginalPrice)}
                            </span>
                          )}

                          {optionDiscount > 0 && (
                            <span className="mt-1 block text-xs font-semibold text-green-700">
                              {optionDiscount}% OFF
                            </span>
                          )}

                          {optionOutOfStock ? (
                            <span className="mt-1 block text-xs text-red-600">
                              Out of stock
                            </span>
                          ) : option.stock !== undefined &&
                            option.stock !== null ? (
                            <span className="mt-1 block text-xs text-gray-500">
                              {option.stock} left
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* DESCRIPTION */}

            {product.description && (
              <div className="mt-6 border-t border-gray-100 pt-5">
                <h3 className="mb-2 text-sm font-semibold text-gray-800">
                  Product Description
                </h3>

                <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
                  {product.description}
                </p>
              </div>
            )}

            {/* STOCK */}

            <div className="mt-5 border-t border-gray-100 pt-4">
              {outOfStock ? (
                <p className="font-semibold text-red-600">
                  Currently Out of Stock
                </p>
              ) : (
                <p className="font-semibold text-green-700">
                  <Check size={17} className="mr-1 inline" />
                  In Stock ({stock} available)
                </p>
              )}
            </div>

            {/* DELIVERY AND WARRANTY */}

            <div className="mt-4 space-y-3 border-y border-gray-100 py-4 text-sm text-gray-600">
              <p className="flex items-center gap-3">
                <Truck size={19} className="shrink-0 text-red-600" />
                Delivery availability at checkout
              </p>

              <p className="flex items-center gap-3">
                <ShieldCheck size={19} className="shrink-0 text-red-600" />
                Secure shopping with E-KART
              </p>

              {product.warranty && (
                <p className="flex items-center gap-3">
                  <Check size={19} className="shrink-0 text-red-600" />
                  Warranty: {formatValue(product.warranty)}
                </p>
              )}
            </div>

            {/* CATEGORY */}

            {product.category && (
              <p className="mt-4 text-xs text-gray-500">
                Category:{" "}
                <strong className="text-gray-800">
                  {typeof product.category === "object"
                    ? product.category.name
                    : product.category}
                </strong>
              </p>
            )}

            {/* ADD TO CART / BUY NOW */}

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={addingToCart || outOfStock}
                onClick={handleAddToCart}
                className="flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-red-600 px-4 py-3 font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart size={19} />
                {addingToCart ? "Please wait..." : "Add to Cart"}
              </button>

              <button
                type="button"
                disabled={addingToCart || outOfStock}
                onClick={handleBuyNow}
                className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Zap size={19} />
                Buy Now
              </button>
            </div>

            {/* CART MESSAGE */}

            {cartMessage && (
              <div
                role="status"
                aria-live="polite"
                className={`mt-4 rounded-lg p-3 text-center text-sm font-semibold ${
                  cartMessageType === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {cartMessage}
              </div>
            )}

            <Link
              to="/shop"
              className="mt-5 block text-center text-sm font-semibold text-gray-500 hover:text-red-600"
            >
              Continue Shopping
            </Link>
          </section>
        </div>

        {/* PRODUCT HIGHLIGHTS */}

        {highlights.length > 0 && (
          <section className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setHighlightsOpen((previous) => !previous)}
              aria-expanded={highlightsOpen}
              className="flex w-full items-center justify-between px-5 py-4 text-left sm:px-6"
            >
              <h2 className="text-lg font-bold text-gray-900">
                Product Highlights
              </h2>

              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                {highlightsOpen ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </span>
            </button>

            {highlightsOpen && (
              <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
                {highlights.map((highlight, index) => {
                  const HighlightIcon = getHighlightIcon(highlight);

                  return (
                    <div
                      key={highlight._id || index}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-gray-700">
                        <HighlightIcon size={21} strokeWidth={1.8} />
                      </div>

                      <p className="break-words text-sm leading-6 text-gray-700">
                        {highlight.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* PRODUCT SPECIFICATIONS */}

        {specifications.length > 0 && (
          <section className="mt-6 rounded-xl bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 text-xl font-bold text-gray-900">
              Product Specifications
            </h2>

            <div className="divide-y divide-gray-100">
              {specifications.map((spec, index) => (
                <div
                  key={spec._id || index}
                  className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-2"
                >
                  <span className="font-semibold text-gray-700">
                    {spec.name || `Specification ${index + 1}`}
                  </span>

                  <span className="break-words text-gray-600">
                    {formatValue(spec.value)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ADDITIONAL PRODUCT DETAILS */}

        {extraDetails.length > 0 && (
          <section className="mt-6 rounded-xl bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 text-xl font-bold text-gray-900">
              More Product Details
            </h2>

            <div className="divide-y divide-gray-100">
              {extraDetails.map(([key, value]) => (
                <div
                  key={key}
                  className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-2"
                >
                  <span className="font-semibold capitalize text-gray-700">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>

                  <span className="break-words text-gray-600">
                    {formatValue(value)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CUSTOMER REVIEWS */}

        <section className="mt-6">
          <ProductReviews productId={product._id || product.id} />
        </section>
      </div>

      {/* LOGIN POPUP */}

      {showLoginPopup && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowLoginPopup(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-popup-title"
            className="relative w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setShowLoginPopup(false)}
              className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Close popup"
            >
              <X size={20} />
            </button>

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <ShoppingCart size={30} className="text-red-600" />
            </div>

            <h2
              id="login-popup-title"
              className="text-xl font-bold text-gray-900"
            >
              Please Login First!
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              Login to your E-KART account before adding products to your cart
              or purchasing this product.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLoginPopup(false)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLoginNow}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                Login Now
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
