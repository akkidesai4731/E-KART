import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Package,
  AlertTriangle,
  CircleX,
  Search,
  RefreshCw,
  Download,
  Plus,
  Minus,
  X,
  Save,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Warehouse,
} from "lucide-react";
import api from "../api/axios.js";

const getId = (product) => product._id || product.id;

const getStock = (product) =>
  Math.max(
    0,
    Number(product.stock ?? product.quantity ?? product.countInStock ?? 0) || 0,
  );

const getPrice = (product) =>
  Number(product.price ?? product.sellingPrice ?? 0) || 0;

const getProductName = (product) =>
  product.name || product.title || "Unnamed product";

const getSKU = (product) =>
  product.sku || product.SKU || product.productCode || "";

const getImage = (product) =>
  product.imageUrl ||
  product.image ||
  product.images?.[0]?.url ||
  product.images?.[0] ||
  "";

const getStockStatus = (stock, threshold) => {
  if (stock === 0) {
    return {
      label: "Out of stock",
      className: "bg-red-50 text-red-700 ring-red-200",
      dot: "bg-red-500",
    };
  }

  if (stock <= threshold) {
    return {
      label: "Low stock",
      className: "bg-amber-50 text-amber-700 ring-amber-200",
      dot: "bg-amber-500",
    };
  }

  return {
    label: "In stock",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  };
};

const normalizeProducts = (data) => {
  const options = [
    data,
    data?.products,
    data?.data,
    data?.data?.products,
    data?.results,
  ];

  return options.find(Array.isArray) || [];
};

const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

function StatCard({ title, value, description, icon: Icon, color }) {
  const styles = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>
        <div className={`rounded-xl p-3 ${styles[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [threshold, setThreshold] = useState(5);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustment, setAdjustment] = useState("add");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("Restock");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    setNotice("");

    try {
      const { data } = await api.get("/products");
      setProducts(normalizeProducts(data));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load products. Check your backend products API.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const stats = useMemo(() => {
    const totalUnits = products.reduce(
      (sum, product) => sum + getStock(product),
      0,
    );
    const lowStock = products.filter((product) => {
      const stock = getStock(product);
      return stock > 0 && stock <= threshold;
    });
    const outOfStock = products.filter((product) => getStock(product) === 0);
    const inventoryValue = products.reduce(
      (sum, product) => sum + getPrice(product) * getStock(product),
      0,
    );

    return {
      totalProducts: products.length,
      totalUnits,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      inventoryValue,
    };
  }, [products, threshold]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
      .filter((product) => {
        const stock = getStock(product);
        const searchable = [
          getProductName(product),
          product.brand,
          product.category,
          getSKU(product),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = searchable.includes(query);
        const matchesFilter =
          filter === "all" ||
          (filter === "in" && stock > threshold) ||
          (filter === "low" && stock > 0 && stock <= threshold) ||
          (filter === "out" && stock === 0);

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        let comparison = 0;

        if (sortBy === "stock") {
          comparison = getStock(a) - getStock(b);
        } else if (sortBy === "price") {
          comparison = getPrice(a) - getPrice(b);
        } else {
          comparison = getProductName(a).localeCompare(getProductName(b));
        }

        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [products, search, filter, sortBy, sortOrder, threshold]);

  function openAdjustment(product, type = "add") {
    setSelectedProduct(product);
    setAdjustment(type);
    setQuantity("1");
    setReason(type === "add" ? "Restock" : "Damaged or missing stock");
    setError("");
    setNotice("");
  }

  function closeAdjustment() {
    if (saving) return;
    setSelectedProduct(null);
    setError("");
  }

  async function saveAdjustment(event) {
    event.preventDefault();

    if (!selectedProduct) return;

    const id = getId(selectedProduct);
    const amount = Number(quantity);
    const currentStock = getStock(selectedProduct);

    if (!id) {
      setError("This product does not have a valid ID.");
      return;
    }

    if (!Number.isInteger(amount) || amount < 1) {
      setError("Enter a whole number greater than zero.");
      return;
    }

    let nextStock = currentStock;

    if (adjustment === "add") {
      nextStock += amount;
    } else if (adjustment === "remove") {
      if (amount > currentStock) {
        setError("You cannot remove more units than are currently in stock.");
        return;
      }
      nextStock -= amount;
    } else {
      nextStock = amount;
    }

    setSaving(true);
    setError("");

    try {
      // Assumes the backend supports PUT /api/products/:id
      // and updates the product's stock field.
      const { data } = await api.put(`/products/${id}`, {
        stock: nextStock,
      });

      const updatedProduct = data?.product || data?.data?.product || data?.data;

      setProducts((current) =>
        current.map((product) =>
          String(getId(product)) === String(id)
            ? {
                ...product,
                ...(updatedProduct &&
                typeof updatedProduct === "object" &&
                !Array.isArray(updatedProduct)
                  ? updatedProduct
                  : {}),
                stock: nextStock,
              }
            : product,
        ),
      );

      setSelectedProduct(null);
      setNotice(
        `${getProductName(selectedProduct)} stock updated: ${currentStock} → ${nextStock}. Reason: ${reason}.`,
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Stock update failed. Make sure your backend supports PUT /api/products/:id and accepts the stock field.",
      );
    } finally {
      setSaving(false);
    }
  }

  function changeSort(value) {
    if (sortBy === value) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(value);
      setSortOrder("asc");
    }
  }

  function exportCSV() {
    if (!filteredProducts.length) return;

    const rows = [
      ["Product", "SKU", "Brand", "Category", "Price", "Stock", "Status"],
      ...filteredProducts.map((product) => [
        getProductName(product),
        getSKU(product),
        product.brand || "",
        product.category || "",
        getPrice(product),
        getStock(product),
        getStockStatus(getStock(product), threshold).label,
      ]),
    ];

    const csv = rows.map((row) => row.map(escapeCSV).join(",")).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ekart-inventory.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen space-y-7 bg-slate-50/70 p-1 sm:p-3">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-300">
              <Warehouse size={17} />
              E-KART ADMINISTRATION
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Inventory management
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Track product quantities, identify stock shortages, and keep your
              electronics store inventory up to date.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => loadProducts(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold transition hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
            <button
              onClick={exportCSV}
              disabled={!filteredProducts.length}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:opacity-50"
            >
              <Download size={17} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Product types"
          value={stats.totalProducts}
          description="Unique product records"
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Units in stock"
          value={stats.totalUnits.toLocaleString()}
          description="Total available quantities"
          icon={Boxes}
          color="emerald"
        />
        <StatCard
          title="Low stock"
          value={stats.lowStock}
          description={`Between 1 and ${threshold} units`}
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Out of stock"
          value={stats.outOfStock}
          description="Products with zero units"
          icon={CircleX}
          color="red"
        />
      </div>

      {/* Inventory value */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 to-white p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-900">
            Estimated inventory value
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            ₹
            {stats.inventoryValue.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Calculated from product price × current stock; not accounting
            profit.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white p-3">
          <label
            htmlFor="threshold"
            className="text-sm font-semibold text-slate-700"
          >
            Low-stock threshold
          </label>
          <input
            id="threshold"
            type="number"
            min="0"
            max="1000000"
            value={threshold}
            onChange={(event) =>
              setThreshold(Math.max(0, Number(event.target.value) || 0))
            }
            className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          />
        </div>
      </div>

      {/* Alerts */}
      {error && !selectedProduct && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
          <button
            onClick={() => loadProducts()}
            className="rounded-lg bg-red-100 px-4 py-2 font-bold hover:bg-red-200"
          >
            Try again
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <p>{notice}</p>
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
            className="ml-auto rounded p-1 hover:bg-emerald-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Product inventory table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Stock overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredProducts.length} of {products.length} products
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 sm:w-72">
                <Search size={18} className="shrink-0 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, brand, SKU..."
                  aria-label="Search inventory"
                  className="w-full bg-transparent py-3 text-sm outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                aria-label="Filter inventory by stock status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="all">All products</option>
                <option value="in">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8">
            <LoaderCircle size={30} className="animate-spin text-emerald-600" />
            <p className="font-semibold text-slate-700">Loading inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
              <Package size={30} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-800">
              {products.length ? "No matching products" : "No products found"}
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              {products.length
                ? "Try changing your search or stock-status filter."
                : "Add products in your Products section to start managing inventory."}
            </p>
            {products.length > 0 && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-900px text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-bold">Product</th>
                  <th className="px-5 py-4 font-bold">Category / SKU</th>
                  <th className="px-5 py-4 font-bold">
                    <button
                      onClick={() => changeSort("price")}
                      className="inline-flex items-center gap-1 hover:text-blue-600"
                    >
                      Price <ArrowUpDown size={13} />
                    </button>
                  </th>
                  <th className="px-5 py-4 font-bold">
                    <button
                      onClick={() => changeSort("stock")}
                      className="inline-flex items-center gap-1 hover:text-blue-600"
                    >
                      Quantity <ArrowUpDown size={13} />
                    </button>
                  </th>
                  <th className="px-5 py-4 font-bold">Stock status</th>
                  <th className="px-5 py-4 text-right font-bold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const stock = getStock(product);
                  const status = getStockStatus(stock, threshold);
                  const image = getImage(product);
                  const id = getId(product);

                  return (
                    <tr key={id} className="transition hover:bg-emerald-50/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {image ? (
                            <img
                              src={image}
                              alt={getProductName(product)}
                              loading="lazy"
                              className="h-12 w-12 rounded-xl border border-slate-200 bg-white object-contain p-1"
                              onError={(event) => {
                                event.currentTarget.style.visibility = "hidden";
                              }}
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                              <Package size={21} />
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="max-w-56 truncate font-bold text-slate-800">
                              {getProductName(product)}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {product.brand || "No brand"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">
                          {product.category || "Uncategorized"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          SKU: {getSKU(product) || "Not assigned"}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-700">
                        ₹{getPrice(product).toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-lg font-black text-slate-900">
                          {stock}
                        </span>
                        <span className="ml-1 text-xs text-slate-400">
                          units
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${status.className}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                          />
                          {status.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button
                            onClick={() => openAdjustment(product)}
                            disabled={!id}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Boxes size={15} />
                            Adjust stock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="flex flex-col justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center">
            <span>
              Showing <strong>{filteredProducts.length}</strong> products
            </span>
            <span>Stock values are loaded from your product API.</span>
          </div>
        )}
      </section>

      {/* Stock adjustment modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAdjustment();
          }}
        >
          <form
            onSubmit={saveAdjustment}
            className="my-auto w-full max-w-md space-y-5 rounded-3xl bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Inventory control
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Adjust stock
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {getProductName(selectedProduct)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAdjustment}
                disabled={saving}
                aria-label="Close stock adjustment"
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">
                Current stock
              </p>
              <p className="mt-1 text-3xl font-black text-slate-900">
                {getStock(selectedProduct)}{" "}
                <span className="text-sm font-medium text-slate-500">
                  units
                </span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "add", label: "Add", Icon: Plus },
                { value: "remove", label: "Remove", Icon: Minus },
                { value: "set", label: "Set total", Icon: Boxes },
              ].map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setAdjustment(value);
                    setError("");
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition ${
                    adjustment === value
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="stockQuantity"
                className="block text-sm font-bold text-slate-700"
              >
                {adjustment === "set" ? "New total quantity" : "Quantity"}
              </label>
              <input
                id="stockQuantity"
                type="number"
                min="1"
                max="100000000"
                step="1"
                required
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value);
                  setError("");
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
              />
              <p className="text-xs text-slate-500">
                New stock:{" "}
                <strong>
                  {adjustment === "add"
                    ? getStock(selectedProduct) +
                      Math.max(0, Number(quantity) || 0)
                    : adjustment === "remove"
                      ? Math.max(
                          0,
                          getStock(selectedProduct) -
                            Math.max(0, Number(quantity) || 0),
                        )
                      : Math.max(0, Number(quantity) || 0)}
                </strong>{" "}
                units
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="stockReason"
                className="block text-sm font-bold text-slate-700"
              >
                Adjustment reason
              </label>
              <select
                id="stockReason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option>Restock</option>
                <option>Damaged or missing stock</option>
                <option>Stock count correction</option>
                <option>Returned item</option>
                <option>Other</option>
              </select>
              <p className="text-xs text-slate-400">
                The reason is shown in the confirmation but is not stored as
                stock history by this frontend.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={closeAdjustment}
                disabled={saving}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}
                {saving ? "Saving..." : "Save stock"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
