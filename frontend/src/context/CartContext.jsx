import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);
const STORAGE_KEY = "ekart-cart";

const getProductId = (item) =>
  String(item?._id ?? item?.id ?? item?.productId ?? "");

const loadCart = () => {
  try {
    const savedCart = localStorage.getItem(STORAGE_KEY);

    if (savedCart !== null) {
      const parsed = JSON.parse(savedCart);
      return Array.isArray(parsed) ? parsed : [];
    }

    const oldCart = localStorage.getItem("cart");

    if (oldCart) {
      const parsed = JSON.parse(oldCart);
      return Array.isArray(parsed) ? parsed : [];
    }

    return [];
  } catch (error) {
    console.error("Could not load cart:", error);
    return [];
  }
};

export function CartProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [cart, setCart] = useState(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Could not save cart:", error);
    }
  }, [cart]);

  const addToCart = useCallback(
    (product, quantity = 1) => {
      if (!isLoggedIn) {
        return {
          success: false,
          message: "Please login first to add products to your cart!",
        };
      }

      const productId = getProductId(product);

      if (!productId) {
        return {
          success: false,
          message: "This product has no valid ID.",
        };
      }

      setCart((currentCart) => {
        const existingItem = currentCart.find(
          (item) => getProductId(item) === productId,
        );

        if (existingItem) {
          return currentCart.map((item) =>
            getProductId(item) === productId
              ? {
                  ...item,
                  quantity:
                    Number(item.quantity || 1) +
                    Math.max(1, Number(quantity) || 1),
                }
              : item,
          );
        }

        return [
          ...currentCart,
          {
            ...product,
            id: productId,
            quantity: Math.max(1, Number(quantity) || 1),
          },
        ];
      });

      return {
        success: true,
        message: "Product added to cart successfully!",
      };
    },
    [isLoggedIn],
  );

  const updateQuantity = useCallback(
    (id, quantity) => {
      if (!isLoggedIn) return;

      const productId = String(id);
      const nextQuantity = Number(quantity);

      if (!Number.isFinite(nextQuantity) || nextQuantity < 1) return;

      setCart((currentCart) =>
        currentCart.map((item) =>
          getProductId(item) === productId
            ? { ...item, quantity: nextQuantity }
            : item,
        ),
      );
    },
    [isLoggedIn],
  );

  // Removing products works whether logged in or logged out.
  const removeFromCart = useCallback((id) => {
    const productId = String(id);

    setCart((currentCart) =>
      currentCart.filter((item) => getProductId(item) !== productId),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = cart.reduce(
    (total, item) => total + Math.max(0, Number(item.quantity) || 0),
    0,
  );

  const cartTotal = cart.reduce((total, item) => {
    const price = Number(item.price ?? item.discountPrice ?? 0);
    const quantity = Math.max(0, Number(item.quantity) || 0);
    return total + price * quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }

  return context;
}
