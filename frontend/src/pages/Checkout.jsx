import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Button from "../components/common/Button";

// API URL automatically handles whether /api is already present.
const RAW_API_URL =
  import.meta.env.VITE_API_URL || "http://192.168.1.102:8000/api";

const API_BASE_URL = RAW_API_URL.replace(/\/+$/, "");

const API_URL = /\/api$/i.test(API_BASE_URL)
  ? API_BASE_URL
  : `${API_BASE_URL}/api`;

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { cart, cartTotal } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  function update(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (loading) return;

    if (!cart.length) {
      setError("Your cart is empty.");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Load Razorpay checkout.
      const loaded = await loadRazorpay();

      if (!loaded) {
        throw new Error(
          "Unable to load Razorpay. Check your internet connection.",
        );
      }

      // Step 2: Create payment order on the backend.
      const response = await fetch(`${API_URL}/payments/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id || item._id,
            quantity: Number(item.quantity),
          })),
          delivery: {
            fullName: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            pinCode: form.pincode.trim(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not create your order.");
      }

      if (!data.orderId || !data.key || !data.amount) {
        throw new Error("The backend returned incomplete payment details.");
      }

      // Step 3: Configure Razorpay.
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "E-Kart",
        description: "Electronics purchase",
        order_id: data.orderId,

        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },

        theme: {
          color: "#dc0000",
        },

        // Step 4: Verify payment on the backend.
        handler: async (paymentResponse) => {
          try {
            setLoading(true);
            setError("");

            const verifyResponse = await fetch(`${API_URL}/payments/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify(paymentResponse),
            });

            const verifyData = await verifyResponse.json();

            if (
              !verifyResponse.ok ||
              !verifyData.success ||
              !verifyData.orderPaid
            ) {
              throw new Error(
                verifyData.message || "Payment has not yet been confirmed.",
              );
            }

            // Navigate only after successful backend verification.
            navigate("/order-success");
          } catch (err) {
            console.error("Payment verification error:", err);

            setError(
              err.message ||
                "Unable to confirm payment. Check your order status before retrying.",
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      // Step 5: Open Razorpay payment window.
      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (failure) => {
        console.error("Razorpay payment failed:", failure.error);

        setError(
          failure.error?.description || "Payment failed. Please try again.",
        );

        setLoading(false);
      });

      razorpay.open();
    } catch (err) {
      console.error("Checkout error:", err);

      setError(err.message || "Unable to start checkout. Please try again.");

      setLoading(false);
    }
  }

  if (!cart.length) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">Your cart is empty</h1>

        <Link to="/shop" className="mt-4 inline-block text-red-600">
          Shop products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="text-3xl font-extrabold">Checkout</h1>

      <p className="mt-2 text-sm text-gray-500">Enter your delivery details.</p>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_330px]">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {[
            ["name", "Full name", "text"],
            ["email", "Email address", "email"],
            ["phone", "Phone number", "tel"],
            ["pincode", "PIN code", "text"],
            ["city", "City", "text"],
          ].map(([name, label, type]) => (
            <label
              key={name}
              className="grid gap-2 text-xs font-bold text-gray-700"
            >
              {label}

              <input
                required
                name={name}
                type={type}
                value={form[name]}
                onChange={update}
                autoComplete={
                  name === "name"
                    ? "name"
                    : name === "email"
                      ? "email"
                      : name === "phone"
                        ? "tel"
                        : name === "pincode"
                          ? "postal-code"
                          : "address-level2"
                }
                className="h-12 rounded-xl border border-gray-200 px-3 text-sm font-normal outline-none focus:border-blue-500"
              />
            </label>
          ))}

          <label className="grid gap-2 text-xs font-bold text-gray-700 sm:col-span-2">
            Delivery address
            <textarea
              required
              name="address"
              value={form.address}
              onChange={update}
              autoComplete="street-address"
              rows={4}
              className="rounded-xl border border-gray-200 p-3 text-sm font-normal outline-none focus:border-blue-500"
            />
          </label>

          {error && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2"
            >
              {error}
            </div>
          )}

          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? "Preparing payment..." : "Continue to payment"}
            </Button>

            <p className="mt-3 text-xs leading-5 text-gray-500">
              You will be redirected to Razorpay checkout to complete your
              payment.
            </p>
          </div>
        </form>

        <aside className="rounded-2xl bg-gray-50 p-5">
          <h2 className="text-lg font-extrabold">Your order</h2>

          {cart.map((item) => (
            <div
              key={item.id || item._id}
              className="flex justify-between gap-4 border-b border-gray-200 py-4 text-xs"
            >
              <span>
                {item.name} × {item.quantity}
              </span>

              <strong className="shrink-0">
                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
              </strong>
            </div>
          ))}

          <div className="flex justify-between pt-5">
            <strong>Total</strong>

            <strong>₹{cartTotal.toLocaleString("en-IN")}</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}
