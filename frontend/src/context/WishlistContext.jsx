import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);
const WISHLIST_KEY = "ekart-wishlist";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://192.168.1.102:8000/api"
).replace(/\/+$/, "");

const API_URL = API_BASE.endsWith("/api")
  ? `${API_BASE}/wishlist`
  : `${API_BASE}/api/wishlist`;

function getProductId(product) {
  const id = product?._id ?? product?.id;
  return id == null ? null : String(id);
}

function normalizeProducts(products) {
  if (!Array.isArray(products)) return [];

  const unique = new Map();

  for (const product of products) {
    const id = getProductId(product);

    if (id && typeof product === "object") {
      unique.set(id, { ...product, id });
    }
  }

  return [...unique.values()];
}

function saveWishlistLocally(products) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(products));
  } catch (error) {
    console.error("Could not save wishlist locally:", error);
  }
}

// Every protected wishlist request uses the token from AuthContext.
async function wishlistRequest(token, path = "", options = {}) {
  if (!token) {
    throw new Error("Please log in to use your wishlist.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Wishlist request failed (${response.status}).`,
    );
  }

  return data;
}

function getProductsFromResponse(data) {
  return normalizeProducts(data?.wishlist?.products);
}

export function WishlistProvider({ children }) {
  // IMPORTANT: AuthContext uses the "customerToken" login state.
  // Read its token directly instead of guessing localStorage key names.
  const { token, isLoggedIn } = useAuth();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState("");

  const syncWishlist = useCallback((products) => {
    const normalized = normalizeProducts(products);

    setWishlist(normalized);
    saveWishlistLocally(normalized);

    return normalized;
  }, []);

  const refreshWishlist = useCallback(async () => {
    if (!isLoggedIn || !token) {
      syncWishlist([]);
      return [];
    }

    setLoading(true);
    setWishlistError("");

    try {
      const data = await wishlistRequest(token);
      return syncWishlist(getProductsFromResponse(data));
    } catch (error) {
      setWishlistError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, token, syncWishlist]);

  const toggleWishlist = useCallback(
    async (product) => {
      if (!isLoggedIn || !token) {
        throw new Error("Please log in first to use your wishlist.");
      }

      const productId = getProductId(product);

      if (!productId) {
        throw new Error("This product has no valid MongoDB product ID.");
      }

      setWishlistError("");

      try {
        const data = await wishlistRequest(token, "/toggle", {
          method: "POST",
          body: JSON.stringify({ productId }),
        });

        syncWishlist(getProductsFromResponse(data));

        return data.action;
      } catch (error) {
        setWishlistError(error.message);
        throw error;
      }
    },
    [isLoggedIn, token, syncWishlist],
  );

  const addToWishlist = useCallback(
    async (product) => {
      if (!isLoggedIn || !token) {
        throw new Error("Please log in first to use your wishlist.");
      }

      const productId = getProductId(product);

      if (!productId) {
        throw new Error("This product has no valid MongoDB product ID.");
      }

      setWishlistError("");

      try {
        const data = await wishlistRequest(token, "/add", {
          method: "POST",
          body: JSON.stringify({ productId }),
        });

        syncWishlist(getProductsFromResponse(data));
        return data;
      } catch (error) {
        setWishlistError(error.message);
        throw error;
      }
    },
    [isLoggedIn, token, syncWishlist],
  );

  const removeFromWishlist = useCallback(
    async (id) => {
      if (!isLoggedIn || !token) {
        throw new Error("Please log in first to use your wishlist.");
      }

      if (id == null) {
        throw new Error("Product ID is missing.");
      }

      setWishlistError("");

      try {
        const data = await wishlistRequest(
          token,
          `/${encodeURIComponent(String(id))}`,
          { method: "DELETE" },
        );

        syncWishlist(getProductsFromResponse(data));
      } catch (error) {
        setWishlistError(error.message);
        throw error;
      }
    },
    [isLoggedIn, token, syncWishlist],
  );

  const clearWishlist = useCallback(async () => {
    if (!isLoggedIn || !token) {
      throw new Error("Please log in first to use your wishlist.");
    }

    const ids = wishlist.map(getProductId).filter(Boolean);

    for (const id of ids) {
      await wishlistRequest(token, `/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    }

    syncWishlist([]);
  }, [isLoggedIn, token, wishlist, syncWishlist]);

  const isWishlisted = useCallback(
    (id) => {
      if (id == null) return false;

      return wishlist.some((item) => getProductId(item) === String(id));
    },
    [wishlist],
  );

  // Load the server wishlist after login and clear the displayed
  // wishlist when the user logs out.
  useEffect(() => {
    if (isLoggedIn && token) {
      refreshWishlist().catch((error) => {
        console.error("Could not load wishlist:", error.message);
      });
    } else {
      syncWishlist([]);
      setWishlistError("");
    }
  }, [isLoggedIn, token, refreshWishlist, syncWishlist]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        wishlistError,
        refreshWishlist,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isWishlisted,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }

  return context;
}
