import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IndianRupee,
  ShoppingBag,
  Package,
  Plus,
  ArrowRight,
  Bell,
  CalendarDays,
  Boxes,
  CircleAlert,
  Search,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

import api from "../api/axios.js";

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function extractProducts(responseData) {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.products)) return responseData.products;
  if (Array.isArray(responseData?.data?.products)) {
    return responseData.data.products;
  }
  return [];
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    outOfStockProducts: 0,
    totalUnits: 0,
    totalInventoryValue: 0,
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [productError, setProductError] = useState("");
  const [search, setSearch] = useState("");

  const fetchDashboard = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");
    setProductError("");

    const [statsResult, productsResult] = await Promise.allSettled([
      api.get("/dashboard/stats"),
      api.get("/products"),
    ]);

    if (statsResult.status === "fulfilled") {
      const result = statsResult.value.data;

      if (result?.success && result?.data) {
        setStats((previous) => ({ ...previous, ...result.data }));
      } else {
        setError("The dashboard API did not return statistics.");
      }
    } else {
      console.error(
        "Dashboard statistics error:",
        statsResult.reason?.response?.data || statsResult.reason?.message,
      );
      setError("Unable to load dashboard statistics. Check your backend.");
    }

    if (productsResult.status === "fulfilled") {
      const result = productsResult.value.data;
      setProducts(extractProducts(result));
    } else {
      console.error(
        "Product list error:",
        productsResult.reason?.response?.data || productsResult.reason?.message,
      );
      setProductError("Unable to load the product inventory.");
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchDashboard(true);

    const interval = setInterval(() => {
      fetchDashboard(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const lowStockProducts = products
    .filter((product) => Number(product.stock ?? 0) <= 10)
    .sort((a, b) => Number(a.stock ?? 0) - Number(b.stock ?? 0))
    .slice(0, 5);

  const filteredProducts = lowStockProducts.filter((product) =>
    String(product.name || "")
      .toLowerCase()
      .includes(search.toLowerCase().trim()),
  );

  const cards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: ShoppingBag,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      title: "Active Products",
      value: stats.activeProducts,
      icon: Package,
      tone: "bg-violet-50 text-violet-600",
    },
    {
      title: "Total Inventory Value",
      value: currency(stats.totalInventoryValue),
      icon: IndianRupee,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Total Stock Units",
      value: stats.totalUnits,
      icon: Boxes,
      tone: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="min-h-screen space-y-7 bg-slate-50/70 p-4 text-slate-900 sm:p-6 xl:p-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-red-600">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            Store overview
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Welcome back! Here is what's happening with your E-Kart store.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 shadow-sm">
            <CalendarDays size={17} />
            <span>
              {new Date().toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboard(false)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm hover:bg-slate-100"
          >
            <Bell size={19} />
          </button>

          <Link
            to="/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
          >
            <Plus size={18} />
            Add product
          </Link>
        </div>
      </header>

      {/* API status */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <CircleAlert size={20} className="shrink-0" />
          <div>
            <p className="font-bold">{error}</p>
            <p className="mt-1">
              Verify that your backend is running and that /api/dashboard/stats
              returns valid data.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500">
          Loading your store statistics...
        </p>
      )}

      {/* Real store statistics */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">Store performance</h2>
          <span className="text-xs font-medium text-emerald-700">
            Live backend data
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ title, value, icon: Icon, tone }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-500">{title}</p>
                <span className={`rounded-xl p-3 ${tone}`}>
                  <Icon size={21} />
                </span>
              </div>

              <p className="mt-5 wrap-break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {loading ? "..." : value}
              </p>

              <p className="mt-3 text-xs text-slate-500">
                Retrieved from your product database
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Inventory */}
      <section className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Inventory health
              </p>
              <h2 className="mt-1 text-xl font-black">Stock overview</h2>
            </div>

            <span className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Boxes size={21} />
            </span>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Out-of-stock products</p>
            <p className="mt-1 text-3xl font-black">
              {loading ? "..." : stats.outOfStockProducts}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Products with stock equal to zero or less
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Low-stock products</p>
            <p className="mt-1 text-3xl font-black">
              {loading
                ? "..."
                : products.filter(
                    (product) =>
                      Number(product.stock ?? 0) > 0 &&
                      Number(product.stock ?? 0) <= 10,
                  ).length}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Products with 1–10 units remaining
            </p>
          </div>

          <Link
            to="/products"
            className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            Manage inventory
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Real low-stock product list */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Inventory alerts
              </p>
              <h2 className="mt-1 text-xl font-black">Low-stock products</h2>
            </div>

            <div className="relative sm:max-w-xs">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-400"
              />
            </div>
          </div>

          {productError && (
            <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {productError}
            </p>
          )}

          <div className="mt-6 space-y-4">
            {filteredProducts.map((product) => (
              <div
                key={product._id || product.id || product.name}
                className="flex items-center gap-3"
              >
                <span className="rounded-xl bg-slate-100 p-3 text-slate-600">
                  <Package size={19} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {product.name || "Unnamed product"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {product.category || "Uncategorized"}
                  </p>
                </div>

                <span className="whitespace-nowrap rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700">
                  {Number(product.stock ?? 0)} left
                </span>
              </div>
            ))}

            {!loading && !productError && filteredProducts.length === 0 && (
              <div className="rounded-xl bg-slate-50 p-6 text-center">
                <Package className="mx-auto text-slate-400" size={28} />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No low-stock products found
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Products with 10 or fewer units will appear here.
                </p>
              </div>
            )}
          </div>

          <Link
            to="/products"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            View all products
            <ExternalLink size={16} />
          </Link>
        </div>
      </section>

      {/* Orders and sales require their own backend APIs */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CircleAlert size={21} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <h2 className="font-black text-slate-900">
              Orders and sales analytics
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Your product and inventory figures are connected. Revenue,
              customer totals, recent orders, and sales charts will display real
              figures once their corresponding backend APIs and database models
              are implemented.
            </p>
            <p className="mt-2 text-xs text-slate-600">
              No sample revenue or order figures are shown here.
            </p>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-black">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Jump straight to common store tasks.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <QuickAction
            to="/products/new"
            title="Add a product"
            description="Create a new product listing"
            color="red"
          />
          <QuickAction
            to="/orders"
            title="Manage orders"
            description="Review orders and update statuses"
            color="blue"
          />
          <QuickAction
            to="/banners"
            title="Manage promotions"
            description="Update banners and sale campaigns"
            color="violet"
          />
        </div>
      </section>
    </div>
  );
}

function QuickAction({ to, title, description, color }) {
  const tones = {
    red: "bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white",
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    violet:
      "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white",
  };

  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <span
        className={`rounded-xl p-3.5 transition ${tones[color] || tones.red}`}
      >
        <ArrowRight size={22} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-bold text-slate-900">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>

      <ArrowRight
        size={18}
        className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-900"
      />
    </Link>
  );
}
