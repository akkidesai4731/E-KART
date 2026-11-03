import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  RefreshCw,
  Search,
  ShoppingBag,
  Clock3,
  PackageCheck,
  IndianRupee,
  Download,
  Eye,
  XCircle,
  Truck,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import api from "../api/axios.js";

const STATUS_OPTIONS = [
  "All",
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

function getOrderId(order) {
  return order._id || order.id || "";
}

function getCustomerName(order) {
  return (
    order.customer?.name ||
    order.user?.name ||
    order.customerName ||
    order.shippingAddress?.name ||
    "Guest Customer"
  );
}

function getOrderTotal(order) {
  return Number(
    order.totalAmount ?? order.total ?? order.amount ?? order.totalPrice ?? 0,
  );
}

function getOrderStatus(order) {
  const status = String(
    order.status || order.orderStatus || "Pending",
  ).toLowerCase();

  const knownStatuses = {
    pending: "Pending",
    processing: "Processing",
    confirmed: "Processing",
    shipped: "Shipped",
    dispatched: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    canceled: "Cancelled",
  };

  return knownStatuses[status] || "Pending";
}

function getOrderDate(order) {
  return (
    order.createdAt || order.orderDate || order.date || order.updatedAt || null
  );
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const statusStyles = {
  Pending: {
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: Clock3,
    dot: "bg-amber-500",
  },
  Processing: {
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    icon: PackageCheck,
    dot: "bg-blue-500",
  },
  Shipped: {
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
    icon: Truck,
    dot: "bg-violet-500",
  },
  Delivered: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
  },
  Cancelled: {
    badge: "bg-red-50 text-red-700 ring-red-200",
    icon: XCircle,
    dot: "bg-red-500",
  },
};

function StatusBadge({ status }) {
  const config = statusStyles[status] || statusStyles.Pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${config.badge}`}
    >
      <Icon size={13} />
      {status}
    </span>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 wrap-break-words text-2xl font-black tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function downloadCSV(orders) {
  const columns = ["Order ID", "Customer", "Email", "Total", "Status", "Date"];

  const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const rows = orders.map((order) => [
    getOrderId(order),
    getCustomerName(order),
    order.customer?.email || order.user?.email || order.email || "",
    getOrderTotal(order),
    getOrderStatus(order),
    formatDate(getOrderDate(order)),
  ]);

  const csv = [columns, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `ekart-orders-${new Date().toISOString().slice(0, 10)}.csv`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const { data } = await api.get("/orders");

      const result = Array.isArray(data)
        ? data
        : Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.data?.orders)
              ? data.data.orders
              : [];

      setOrders(result);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load orders. Check your backend route and server.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const stats = useMemo(() => {
    const totalValue = orders.reduce(
      (sum, order) => sum + getOrderTotal(order),
      0,
    );

    return {
      total: orders.length,
      pending: orders.filter((order) => getOrderStatus(order) === "Pending")
        .length,
      delivered: orders.filter((order) => getOrderStatus(order) === "Delivered")
        .length,
      totalValue,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders
      .filter((order) => {
        const id = String(getOrderId(order)).toLowerCase();
        const customer = getCustomerName(order).toLowerCase();
        const email = String(
          order.customer?.email || order.user?.email || order.email || "",
        ).toLowerCase();

        const matchesSearch =
          !query ||
          id.includes(query) ||
          id.slice(-10).includes(query) ||
          customer.includes(query) ||
          email.includes(query);

        const matchesStatus =
          statusFilter === "All" || getOrderStatus(order) === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(getOrderDate(a) || 0).getTime();
        const dateB = new Date(getOrderDate(b) || 0).getTime();

        if (sortOrder === "oldest") return dateA - dateB;
        if (sortOrder === "highest") {
          return getOrderTotal(b) - getOrderTotal(a);
        }
        if (sortOrder === "lowest") {
          return getOrderTotal(a) - getOrderTotal(b);
        }

        return dateB - dateA;
      });
  }, [orders, search, statusFilter, sortOrder]);

  return (
    <div className="min-h-screen space-y-7 bg-slate-50/70 p-1 sm:p-2">
      {/* Page heading */}
      <section className="flex flex-col justify-between gap-5 rounded-3xl bg-linear-to-r from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg sm:p-8 lg:flex-row lg:items-center">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-200">
            <ShoppingBag size={17} />
            E-KART ADMINISTRATION
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Order Management
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Monitor customer purchases, track order statuses, and review your
            store's order activity in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => downloadCSV(filteredOrders)}
            disabled={loading || filteredOrders.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={17} />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => loadOrders(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh orders"}
          </button>
        </div>
      </section>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-bold">Unable to load orders</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="self-start rounded-lg bg-red-100 px-4 py-2 text-sm font-bold hover:bg-red-200 sm:self-center"
          >
            Try again
          </button>
        </div>
      )}

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total orders"
          value={loading ? "—" : stats.total.toLocaleString("en-IN")}
          subtitle="All orders received"
          icon={ShoppingBag}
          color="bg-blue-50 text-blue-700"
        />

        <StatCard
          title="Pending orders"
          value={loading ? "—" : stats.pending.toLocaleString("en-IN")}
          subtitle="Awaiting further action"
          icon={Clock3}
          color="bg-amber-50 text-amber-700"
        />

        <StatCard
          title="Delivered orders"
          value={loading ? "—" : stats.delivered.toLocaleString("en-IN")}
          subtitle="Successfully delivered"
          icon={PackageCheck}
          color="bg-emerald-50 text-emerald-700"
        />

        <StatCard
          title="Total order value"
          value={loading ? "—" : currency(stats.totalValue)}
          subtitle="Combined value of all orders"
          icon={IndianRupee}
          color="bg-violet-50 text-violet-700"
        />
      </section>

      {/* Orders table and filters */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">All orders</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? "Loading your order records..."
                  : `Showing ${filteredOrders.length} of ${orders.length} orders`}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 sm:w-72">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search order, customer, email..."
                  aria-label="Search orders"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <XCircle size={17} />
                  </button>
                )}
              </div>

              <div className="relative sm:w-48">
                <Filter
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by order status"
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status === "All" ? "All statuses" : status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick status filters */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {STATUS_OPTIONS.map((status) => {
              const count =
                status === "All"
                  ? orders.length
                  : orders.filter((order) => getOrderStatus(order) === status)
                      .length;

              const active = statusFilter === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-slate-950 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {status}
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      active
                        ? "bg-white/15 text-white"
                        : "bg-white text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16 text-slate-500">
            <RefreshCw size={28} className="animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="rounded-2xl bg-slate-100 p-5 text-slate-400">
              <ShoppingBag size={32} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              {orders.length === 0 ? "No orders yet" : "No matching orders"}
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {orders.length === 0
                ? "Customer purchases will appear here once orders are created."
                : "Try changing your search term or selecting a different status."}
            </p>

            {(search || statusFilter !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                }}
                className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-850px text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-bold">Order</th>
                  <th className="px-5 py-4 font-bold">Customer</th>
                  <th className="px-5 py-4 font-bold">
                    <button
                      type="button"
                      onClick={() =>
                        setSortOrder((current) =>
                          current === "highest" ? "lowest" : "highest",
                        )
                      }
                      className="inline-flex items-center gap-2 hover:text-blue-600"
                    >
                      Amount
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="px-5 py-4 font-bold">Order date</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 text-right font-bold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order, index) => {
                  const id = getOrderId(order);
                  const status = getOrderStatus(order);
                  const customer = getCustomerName(order);
                  const email =
                    order.customer?.email ||
                    order.user?.email ||
                    order.email ||
                    "";

                  return (
                    <tr
                      key={id || `order-${index}`}
                      className="transition hover:bg-blue-50/40"
                    >
                      <td className="px-5 py-4">
                        <p className="font-extrabold text-slate-900">
                          #
                          {String(id || "N/A")
                            .slice(-10)
                            .toUpperCase()}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {order.items?.length ?? order.orderItems?.length ?? 0}{" "}
                          item types
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-indigo-100 text-sm font-black text-blue-700">
                            {customer
                              .split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase() || "G"}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-48 truncate font-bold text-slate-900">
                              {customer}
                            </p>
                            <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                              {email || "No email available"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-extrabold text-slate-900">
                        {currency(getOrderTotal(order))}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <CalendarDays size={15} className="text-slate-400" />
                          {formatDate(getOrderDate(order))}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={status} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        {id ? (
                          <Link
                            to={`/orders/${id}`}
                            aria-label={`View order ${id}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Eye size={16} />
                            View
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">
                            No order ID
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && filteredOrders.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Displaying{" "}
              <span className="font-bold text-slate-800">
                {filteredOrders.length}
              </span>{" "}
              orders
            </p>
            <p>
              Sorted by{" "}
              {sortOrder === "newest"
                ? "newest first"
                : sortOrder === "oldest"
                  ? "oldest first"
                  : sortOrder === "highest"
                    ? "highest amount"
                    : "lowest amount"}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
