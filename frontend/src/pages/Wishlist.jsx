import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

export default function Wishlist() {
  const wishlistContext = useWishlist();
  const { addToCart } = useCart();

  const { removeFromWishlist, refreshWishlist } = wishlistContext;

  // Supports common wishlist state names.
  const rawWishlist =
    wishlistContext.wishlist ??
    wishlistContext.wishlistItems ??
    wishlistContext.items ??
    [];

  const wishlist = Array.isArray(rawWishlist)
    ? rawWishlist
    : Array.isArray(rawWishlist?.items)
      ? rawWishlist.items
      : [];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [removingId, setRemovingId] = useState("");

  useEffect(() => {
    let active = true;

    async function loadWishlist() {
      try {
        setError("");

        if (typeof refreshWishlist === "function") {
          await refreshWishlist();
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Could not load your wishlist.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadWishlist();

    return () => {
      active = false;
    };
  }, [refreshWishlist]);

  const getProduct = (entry) => entry?.product ?? entry;

  const getProductId = (product) =>
    product?._id ?? product?.id ?? product?.productId;

  const getProductImage = (product) => {
    if (product?.imageUrl) return product.imageUrl;
    if (typeof product?.image === "string") return product.image;

    if (Array.isArray(product?.images)) {
      const first = product.images[0];
      return typeof first === "string" ? first : first?.url;
    }

    return "";
  };

  const handleRemove = async (product) => {
    const id = getProductId(product);

    if (!id || typeof removeFromWishlist !== "function") {
      setError("Could not identify this wishlist product.");
      return;
    }

    try {
      setError("");
      setMessage("");
      setRemovingId(String(id));

      await removeFromWishlist(String(id));

      if (typeof refreshWishlist === "function") {
        await refreshWishlist();
      }

      setMessage("Product removed from wishlist.");
    } catch (err) {
      setError(err.message || "Could not remove this product.");
    } finally {
      setRemovingId("");
    }
  };

  const handleAddToCart = (product) => {
    try {
      const id = getProductId(product);

      if (!id) {
        setError("This product has no valid ID.");
        return;
      }

      const result = addToCart({
        ...product,
        _id: String(id),
        id: String(id),
        name: product.name || product.title || "Product",
        image: getProductImage(product),
        price: Number(product.price ?? 0),
        stock: Number(product.stock ?? product.quantity ?? 0),
      });

      if (result?.success === false) {
        setError(result.message || "Could not add product to cart.");
        return;
      }

      setError("");
      setMessage("Product added to cart.");
    } catch (err) {
      setError(err.message || "Could not add product to cart.");
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-gray-600">Loading your wishlist...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <Heart className="text-red-600" size={30} />
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">My Wishlist</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your saved E-KART products
          </p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700"
        >
          {message}
        </p>
      )}

      {wishlist.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
          <Heart className="mx-auto mb-4 text-gray-300" size={48} />
          <h2 className="text-xl font-bold text-gray-900">
            Your wishlist is empty
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Browse our products and tap the heart to save your favourites.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlist.map((entry, index) => {
            const product = getProduct(entry);
            const id = getProductId(product);
            const name = product?.name || product?.title || "Product";
            const image = getProductImage(product);
            const price = Number(product?.price ?? 0);

            return (
              <article
                key={String(id || index)}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <Link
                  to={id ? `/product/${id}` : "/shop"}
                  className="flex aspect-square items-center justify-center bg-gray-50 p-5"
                >
                  {image ? (
                    <img
                      src={image}
                      alt={name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-sm text-gray-400">
                      No product image
                    </span>
                  )}
                </Link>

                <div className="p-4">
                  <Link
                    to={id ? `/product/${id}` : "/shop"}
                    className="font-bold text-gray-900 hover:text-red-600"
                  >
                    {name}
                  </Link>

                  <p className="mt-2 text-lg font-extrabold text-gray-900">
                    ₹{price.toLocaleString("en-IN")}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      <ShoppingCart size={16} />
                      Add to Cart
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(product)}
                      disabled={removingId === String(id)}
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      {removingId === String(id) ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
