import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Button from "../components/common/Button";

export default function Cart() {
  const { cart, cartTotal, updateQuantity, removeFromCart } = useCart();

  if (!cart.length) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-7xl flex-col items-center justify-center px-5 text-center">
        <ShoppingBag size={48} className="text-red-600" />
        <h1 className="mt-5 text-3xl font-extrabold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-gray-500">
          Discover something useful for your home.
        </p>
        <Link to="/shop" className="mt-6">
          <Button>Explore products</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="text-3xl font-extrabold">Shopping cart</h1>
      <p className="mt-2 text-sm text-gray-500">
        Review your products before checkout.
      </p>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_330px]">
        <div className="divide-y divide-gray-100">
          {cart.map((item) => (
            <article
              key={item.id}
              className="grid grid-cols-[82px_1fr] gap-4 py-5 sm:grid-cols-[110px_1fr_auto]"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-24 w-full rounded-xl bg-gray-50 object-contain p-2 sm:h-28"
              />

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {item.category}
                </p>
                <h2 className="mt-2 text-sm font-bold">{item.name}</h2>
                <p className="mt-2 text-sm font-extrabold">
                  ₹{item.price.toLocaleString("en-IN")}
                </p>

                <div className="mt-3 inline-flex items-center rounded-lg border border-gray-200">
                  <button
                    aria-label="Decrease quantity"
                    disabled={item.quantity <= 1}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="grid h-8 w-8 place-items-center disabled:opacity-30"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="min-w-8 text-center text-xs">
                    {item.quantity}
                  </span>
                  <button
                    aria-label="Increase quantity"
                    disabled={item.quantity >= item.stock}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="grid h-8 w-8 place-items-center disabled:opacity-30"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:flex-col sm:items-end sm:justify-start sm:gap-6">
                <strong className="text-sm">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </strong>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-400 hover:text-red-600"
                  aria-label="Remove item"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="rounded-2xl border border-gray-100 bg-gray-50 p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Order summary</h2>
          <div className="mt-5 flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <strong>₹{cartTotal.toLocaleString("en-IN")}</strong>
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-gray-500">Delivery</span>
            <span className="text-right text-gray-500">Calculated later</span>
          </div>
          <div className="mt-5 flex justify-between border-t border-gray-200 pt-5">
            <strong>Estimated total</strong>
            <strong>₹{cartTotal.toLocaleString("en-IN")}</strong>
          </div>

          <Link to="/checkout" className="mt-6 block">
            <Button className="w-full">Continue to checkout</Button>
          </Link>
          <Link
            to="/shop"
            className="mt-4 block text-center text-xs font-bold text-gray-500 hover:text-red-600"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </main>
  );
}
