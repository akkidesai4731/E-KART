import { useState } from "react";
import { Heart, ShoppingCart, Star, X, LockKeyhole } from "lucide-react";
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

  const productId = product._id ?? product.id;
  const productName = product.name || product.title || "Product";

  const category =
    typeof product.category === "object"
      ? product.category?.name || product.category?.title || ""
      : product.category || "";

  const image =
    product.imageUrl ||
    product.image ||
    (Array.isArray(product.images)
      ? typeof product.images[0] === "string"
        ? product.images[0]
        : product.images[0]?.url
      : "");

  const price = Number(product.price ?? 0);
  const stock = Number(product.stock ?? product.quantity ?? 0);
  const rating = Number(product.rating ?? product.ratings?.average ?? 0);

  const saved = productId ? isWishlisted(productId) : false;

  const openLoginPopup = (reason) => {
    setLoginReason(reason);
    setShowLoginPopup(true);
  };

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

    // Do not allow adding products to cart without login.
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

      setCartMessage("Product added to cart successfully!");
    } catch (error) {
      console.error("Add to cart error:", error);
      setCartMessage(error.message || "Could not add product to cart.");
    }
  };

  const handleWishlist = async () => {
    if (wishlistLoading) return;

    setWishlistMessage("");

    // Ask the user to log in before calling the wishlist API.
    if (!isLoggedIn) {
      openLoginPopup("wishlist");
      return;
    }

    if (!productId) {
      setWishlistMessage("This product has no valid ID.");
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

      setWishlistMessage(
        error.message || "Could not update wishlist. Please try again.",
      );
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleLoginNow = () => {
    setShowLoginPopup(false);

    navigate("/login", {
      state: {
        from: location.pathname + location.search,
      },
    });
  };

  return (
    <>
      <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/60">
        {/* Product image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.badge && (
            <div className="absolute left-3 top-3 z-10">
              <Badge>{product.badge}</Badge>
            </div>
          )}

          {/* Wishlist button */}
          <button
            type="button"
            onClick={handleWishlist}
            disabled={wishlistLoading || !productId}
            aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={saved}
            title={saved ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm transition disabled:opacity-60 ${
              saved ? "text-red-600" : "text-gray-600 hover:text-red-600"
            }`}
          >
            <Heart size={17} fill={saved ? "currentColor" : "none"} />
          </button>

          <Link
            to={productId ? `/product/${productId}` : "#"}
            aria-label={`View ${productName}`}
            className="grid h-full place-items-center p-4"
            onClick={(event) => {
              if (!productId) event.preventDefault();
            }}
          >
            {image ? (
              <img
                src={image}
                alt={productName}
                loading="lazy"
                className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-center text-sm text-gray-400">
                No product image
              </div>
            )}
          </Link>
        </div>

        {/* Product details */}
        <div className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {category}
          </p>

          <Link
            to={productId ? `/product/${productId}` : "#"}
            onClick={(event) => {
              if (!productId) event.preventDefault();
            }}
            className="mt-2 block min-h-12 text-sm font-bold leading-6 text-gray-900 hover:text-red-600"
          >
            {productName}
          </Link>

          <div className="mt-2 flex items-center gap-1 text-xs text-amber-500">
            <Star size={14} fill="currentColor" />
            <span className="font-semibold">{rating.toFixed(1)}</span>
            <span className="text-gray-400">customer rating</span>
          </div>

          {/* Price and Add to Cart */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-lg font-extrabold text-gray-950">
              ₹{price.toLocaleString("en-IN")}
            </span>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!productId || stock <= 0}
              aria-label={`Add ${productName} to cart`}
              title={stock <= 0 ? "Out of stock" : "Add to cart"}
              className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingCart size={18} />
            </button>
          </div>

          <p
            className={`mt-3 text-[11px] ${
              stock > 0 ? "text-green-700" : "text-red-600"
            }`}
          >
            {stock > 0 ? `In stock (${stock})` : "Out of stock"}
          </p>

          {cartMessage && (
            <p
              role="status"
              className={`mt-2 text-xs ${
                cartMessage.includes("successfully")
                  ? "text-green-700"
                  : "text-red-600"
              }`}
            >
              {cartMessage}
            </p>
          )}

          {wishlistMessage && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-2 break-words text-xs ${
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

      {/* Login popup for cart and wishlist */}
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
              className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100"
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
                ? "You need to log in to your account before adding products to your wishlist."
                : "You need to log in to your account before adding products to your cart."}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLoginPopup(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLoginNow}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
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
