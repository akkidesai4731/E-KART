import { useMemo, useState } from "react";
import { Heart, ShoppingCart, Star, X, LockKeyhole, Check } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import Badge from "../common/Badge";

export default function ProductCard({ product = {} }) {
  const { addToCart } = useCart();
  const { isLoggedIn } = useAuth();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const navigate = useNavigate();
  const location = useLocation();

  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginReason, setLoginReason] = useState("cart");
  const [cartMessage, setCartMessage] = useState("");

  // ------------------------------------------
  // DYNAMIC PRODUCT DATA
  // ------------------------------------------

  const productId = product._id ?? product.id;
  const productName = product.name || product.title || "Product";

  const category =
    typeof product.category === "object"
      ? product.category?.name || product.category?.title || ""
      : product.category || "";

  const image = useMemo(() => {
    const firstImage = Array.isArray(product.images) ? product.images[0] : null;

    if (typeof firstImage === "string") return firstImage;

    return (
      product.imageUrl ||
      product.image ||
      firstImage?.url ||
      firstImage?.imageUrl ||
      ""
    );
  }, [product]);

  const price = Number(product.price ?? 0);

  const originalPrice = Number(
    product.originalPrice ?? product.mrp ?? product.compareAtPrice ?? 0,
  );

  const discount =
    originalPrice > price && originalPrice > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const stock = Number(product.stock ?? product.quantity ?? 0);

  const rating = Number(product.rating ?? product.ratings?.average ?? 0);

  const reviewCount = Number(
    product.numReviews ?? product.reviewCount ?? product.ratings?.count ?? 0,
  );

  const saved = productId ? isWishlisted(productId) : false;

  // ------------------------------------------
  // LOGIN POPUP
  // ------------------------------------------

  const openLoginPopup = (reason) => {
    setLoginReason(reason);
    setShowLoginPopup(true);
  };

  const handleLoginNow = () => {
    setShowLoginPopup(false);

    navigate("/login", {
      state: {
        from: location.pathname + location.search,
      },
    });
  };

  // ------------------------------------------
  // ADD TO CART
  // ------------------------------------------

  const handleAddToCart = () => {
    setCartMessage("");

    if (!productId) {
      setCartMessage("Product ID is missing.");
      return;
    }

    if (stock <= 0) {
      setCartMessage("This product is out of stock.");
      return;
    }

    if (!isLoggedIn) {
      openLoginPopup("cart");
      return;
    }

    try {
      const result = addToCart({
        ...product,
        _id: String(productId),
        id: String(productId),
        name: productName,
        image,
        price,
        stock,
      });

      if (result?.success === false) {
        setCartMessage(result.message || "Could not add product to cart.");
        return;
      }

      if (result?.success !== true) {
        setCartMessage("Could not confirm that the product was added.");
        return;
      }

      setCartMessage("Added to cart successfully!");
    } catch (error) {
      console.error("Add to cart error:", error);
      setCartMessage(error.message || "Could not add product to cart.");
    }
  };

  // ------------------------------------------
  // WISHLIST
  // ------------------------------------------

  const handleWishlist = async () => {
    if (wishlistLoading) return;

    setWishlistMessage("");

    if (!isLoggedIn) {
      openLoginPopup("wishlist");
      return;
    }

    if (!productId) {
      setWishlistMessage("Product ID is missing.");
      return;
    }

    setWishlistLoading(true);

    try {
      const action = await toggleWishlist({
        ...product,
        _id: String(productId),
        id: String(productId),
        name: productName,
        image,
        price,
      });

      setWishlistMessage(
        action === "removed"
          ? "Removed from wishlist."
          : "Added to wishlist successfully.",
      );
    } catch (error) {
      console.error("Wishlist API error:", error);

      setWishlistMessage(error.message || "Could not update wishlist.");
    } finally {
      setWishlistLoading(false);
    }
  };

  // ------------------------------------------
  // PRODUCT CARD UI
  // ------------------------------------------

  return (
    <>
      <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-gray-300 hover:shadow-lg">
        {/* PRODUCT IMAGE */}
        <div className="relative h-[190px] shrink-0 overflow-hidden bg-white sm:h-[210px] lg:h-[225px]">
          {/* PRODUCT BADGE */}
          {product.badge && (
            <div className="absolute left-3 top-3 z-10">
              <Badge>{product.badge}</Badge>
            </div>
          )}

          {/* DISCOUNT BADGE */}
          {!product.badge && discount > 0 && (
            <span className="absolute left-3 top-3 z-10 rounded-sm bg-green-600 px-2 py-1 text-[10px] font-bold text-white">
              {discount}% OFF
            </span>
          )}

          {/* WISHLIST */}
          <button
            type="button"
            onClick={handleWishlist}
            disabled={wishlistLoading || !productId}
            aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={saved}
            title={saved ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-gray-100 bg-white shadow-sm transition hover:shadow-md disabled:opacity-50 ${
              saved ? "text-red-600" : "text-gray-500 hover:text-red-600"
            }`}
          >
            <Heart size={18} fill={saved ? "currentColor" : "none"} />
          </button>

          {/* IMAGE LINK */}
          <Link
            to={productId ? `/product/${productId}` : "#"}
            aria-label={`View ${productName}`}
            className="flex h-full w-full items-center justify-center p-4 sm:p-5"
            onClick={(event) => {
              if (!productId) event.preventDefault();
            }}
          >
            {image ? (
              <img
                src={image}
                alt={productName}
                loading="lazy"
                className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                No product image available
              </div>
            )}
          </Link>
        </div>

        {/* PRODUCT INFORMATION */}
        <div className="flex flex-1 flex-col border-t border-gray-100 p-3 sm:p-4">
          {/* CATEGORY */}
          <p className="mb-1 min-h-4 truncate text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {category || "Electronics"}
          </p>

          {/* PRODUCT NAME */}
          <Link
            to={productId ? `/product/${productId}` : "#"}
            onClick={(event) => {
              if (!productId) event.preventDefault();
            }}
            title={productName}
            className="line-clamp-2 min-h-[42px] text-sm font-semibold leading-5 text-gray-800 transition hover:text-blue-700 sm:text-[14px]"
          >
            {productName}
          </Link>

          {/* RATING */}
          <div className="mt-2 flex min-h-6 flex-wrap items-center gap-2">
            {rating > 0 ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-sm bg-green-700 px-1.5 py-0.5 text-[11px] font-bold text-white">
                  {rating.toFixed(1)}
                  <Star size={11} fill="currentColor" />
                </span>

                <span className="truncate text-[11px] text-gray-400">
                  {reviewCount > 0
                    ? `${reviewCount.toLocaleString("en-IN")} ratings`
                    : "Customer rating"}
                </span>
              </>
            ) : (
              <span className="text-[11px] text-gray-400">No ratings yet</span>
            )}
          </div>

          {/* PRICE */}
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-lg font-bold tracking-tight text-gray-900">
              ₹{price.toLocaleString("en-IN")}
            </span>

            {originalPrice > price && (
              <>
                <span className="text-xs text-gray-400 line-through">
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>

                {discount > 0 && (
                  <span className="text-[11px] font-semibold text-green-700">
                    {discount}% off
                  </span>
                )}
              </>
            )}
          </div>

          {/* STOCK */}
          <div className="mt-2 flex items-center gap-1.5">
            {stock > 0 ? (
              <>
                <Check size={13} className="text-green-600" />
                <span className="text-[11px] font-medium text-green-700">
                  In stock
                </span>
              </>
            ) : (
              <span className="text-[11px] font-semibold text-red-600">
                Currently unavailable
              </span>
            )}
          </div>

          {/* SPACER */}
          <div className="flex-1" />

          {/* ADD TO CART */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!productId || stock <= 0}
            aria-label={`Add ${productName} to cart`}
            className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#e60023] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#c9001e] disabled:cursor-not-allowed disabled:bg-gray-300 sm:text-sm"
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>

          {/* CART MESSAGE */}
          {cartMessage && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-2 text-center text-[11px] font-medium ${
                cartMessage.includes("successfully")
                  ? "text-green-700"
                  : "text-red-600"
              }`}
            >
              {cartMessage}
            </p>
          )}

          {/* WISHLIST MESSAGE */}
          {wishlistMessage && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-2 break-words text-center text-[11px] ${
                wishlistMessage.includes("successfully") ||
                wishlistMessage.includes("Removed")
                  ? "text-green-700"
                  : "text-red-600"
              }`}
            >
              {wishlistMessage}
            </p>
          )}
        </div>
      </article>

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
            aria-labelledby="product-login-title"
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setShowLoginPopup(false)}
              aria-label="Close popup"
              className="absolute right-3 top-3 rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
            >
              <X size={20} />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <LockKeyhole size={27} />
            </div>

            <h2
              id="product-login-title"
              className="text-xl font-bold text-gray-900"
            >
              Please login first!
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {loginReason === "wishlist"
                ? "Please log in to add products to your wishlist."
                : "Please log in to add products to your shopping cart."}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLoginPopup(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLoginNow}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Login Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
