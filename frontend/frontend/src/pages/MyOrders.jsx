import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Package, RefreshCw, ShoppingBag } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://192.168.1.102:8000/api";

export default function MyOrders() {
  const { token } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      if (!token) {
        setOrders([]);
        setError("Please log in to view your orders.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await axios.get(`${API_URL}/orders/my-orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const body = response.data;

        const list = Array.isArray(body.orders)
          ? body.orders
          : Array.isArray(body.data)
            ? body.data
            : Array.isArray(body.data?.orders)
              ? body.data.orders
              : [];

        if (!cancelled) {
          setOrders(list);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load your orders. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <RefreshCw className="mx-auto animate-spin text-red-600" size={32} />
        <p className="mt-4 text-gray-500">Loading your orders...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-[55vh] max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-600">
          <Package size={25} />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and review your purchases.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-700"
        >
          <p className="font-medium">{error}</p>

          {token && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold underline"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          )}

          {!token && (
            <Link
              to="/login"
              className="mt-3 inline-block font-semibold underline"
            >
              Log in
            </Link>
          )}
        </div>
      )}

      {!error && orders.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
          <ShoppingBag size={48} className="mx-auto text-gray-300" />

          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            No orders yet
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Your purchases will appear here after you place an order.
          </p>

          <Link
            to="/shop"
            className="mt-6 inline-flex rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            Start shopping
          </Link>
        </div>
      )}

      <div className="space-y-5">
        {orders.map((order) => {
          const orderId = order._id;
          const orderStatus = order.orderStatus || order.status || "Pending";

          const items = Array.isArray(order.items) ? order.items : [];

          return (
            <article
              key={orderId}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900">
                    Order #{order.orderNumber || orderId}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Placed on{" "}
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Date unavailable"}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ₹
                    {Number(
                      order.totalAmount ?? order.total ?? 0,
                    ).toLocaleString("en-IN")}
                  </p>

                  <span className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {orderStatus}
                  </span>
                </div>
              </div>

              <div className="my-5 border-t border-gray-100" />

              <div>
                <p className="mb-3 text-sm font-semibold text-gray-800">
                  Items ({items.length})
                </p>

                {items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={item._id || item.product || index}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-800">
                            {item.name || item.product?.name || "Product"}
                          </p>
                          <p className="mt-1 text-gray-500">
                            Quantity: {item.quantity || 1}
                          </p>
                        </div>

                        <p className="shrink-0 font-medium text-gray-800">
                          ₹
                          {(
                            Number(item.price || 0) * Number(item.quantity || 1)
                          ).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Item details are unavailable.
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">
                  Payment: {order.paymentMethod || "Not specified"}
                </p>

                <Link
                  to={`/orders/${orderId}`}
                  className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
                >
                  View Order
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
