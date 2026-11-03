import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../api/axios.js";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then(({ data }) => {
        const item = data.order || data.data || data;
        setOrder(item);
        setStatus(item.status || item.orderStatus || "Pending");
      })
      .catch((err) =>
        setMessage(err.response?.data?.message || "Could not load this order."),
      )
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus() {
    setMessage("");
    try {
      await api.patch(`/orders/${id}/status`, { status });
      setMessage("Order status updated.");
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Status update failed. Check the backend route.",
      );
    }
  }

  if (loading) return <p>Loading order...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/orders"
        className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600"
      >
        <ArrowLeft size={17} /> Back to orders
      </Link>
      <h1 className="text-3xl font-black text-slate-950">Order details</h1>

      {message && (
        <p
          role="status"
          className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800"
        >
          {message}
        </p>
      )}

      {order ? (
        <div className="space-y-5 rounded-2xl border bg-white p-6">
          <p className="text-sm text-slate-500">
            Order ID:{" "}
            <strong className="text-slate-900">
              {order._id || order.id || id}
            </strong>
          </p>
          <p>
            Customer:{" "}
            <strong>
              {order.customer?.name ||
                order.user?.name ||
                order.customerName ||
                "—"}
            </strong>
          </p>
          <p>
            Total:{" "}
            <strong>
              ₹
              {Number(
                order.totalAmount ?? order.total ?? order.amount ?? 0,
              ).toLocaleString("en-IN")}
            </strong>
          </p>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Order status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border p-3"
            >
              {[
                "Pending",
                "Processing",
                "Shipped",
                "Delivered",
                "Cancelled",
              ].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={updateStatus}
            className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700"
          >
            Update status
          </button>
        </div>
      ) : (
        <p className="rounded-xl border bg-white p-6 text-slate-600">
          Order details are unavailable.
        </p>
      )}
    </div>
  );
}
