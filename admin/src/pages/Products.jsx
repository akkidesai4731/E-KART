import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  Package,
  Tags,
  IndianRupee,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  Image as ImageIcon,
  Filter,
  RotateCcw,
  CheckCircle2,
  LayoutGrid,
  List,
} from "lucide-react";
import api from "../api/axios.js";

const PAGE_SIZE = 8;

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function getProductRows(payload) {
  const candidates = [
    payload,
    payload?.data,
    payload?.products,
    payload?.data?.products,
    payload?.data?.data,
  ];

  return candidates.find(Array.isArray) || [];
}

function getProductId(product) {
  return product?._id || product?.id;
}

function getImage(product) {
  const images = product?.images;
  const firstImage = Array.isArray(images) ? images[0] : null;

  return (
    product?.imageUrl ||
    product?.image ||
    (typeof firstImage === "string" ? firstImage : firstImage?.url) ||
    ""
  );
}

function StatCard({ title, value, description, icon: Icon, tone }) {
  const colors = {
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 wrap-break-words text-2xl font-black tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>

        <span className={`rounded-xl p-3 ${colors[tone] || colors.blue}`}>
          <Icon size={21} />
        </span>
      </div>
    </div>
  );
}

function ProductImage({ product, large = false }) {
  const [failed, setFailed] = useState(false);
  const image = getImage(product);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 ${
        large ? "h-20 w-20" : "h-14 w-14"
      }`}
    >
      {image && !failed ? (
        <img
          src={image}
          alt={product?.name || "Product"}
          loading="lazy"
          className="h-full w-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        <ImageIcon className="text-slate-300" size={large ? 28 : 21} />
      )}
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [view, setView] = useState("table");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [notice, setNotice] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await api.get("/products");
      const rows = getProductRows(response.data);

      setProducts(rows);
      setSelected([]);
      setPage(1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not load products. Check your backend API and connection.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(
    () =>
      [
        ...new Set(products.map((product) => product.category).filter(Boolean)),
      ].sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const stats = useMemo(() => {
    const catalogueValue = products.reduce(
      (sum, product) => sum + (Number(product.price) || 0),
      0,
    );

    const categoryCount = new Set(
      products.map((product) => product.category).filter(Boolean),
    ).size;

    const pricedProducts = products.filter(
      (product) =>
        Number.isFinite(Number(product.price)) && product.price != null,
    ).length;

    return {
      total: products.length,
      categories: categoryCount,
      catalogueValue,
      pricedProducts,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const rows = products.filter((product) => {
      const searchableText = [
        product.name,
        product.brand,
        product.category,
        getProductId(product),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        searchableText.includes(query) &&
        (category === "All" || product.category === category)
      );
    });

    return [...rows].sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }

      if (sortBy === "price-low") {
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      }

      if (sortBy === "price-high") {
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      }

      return 0;
    });
  }, [products, search, category, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE),
  );

  const currentPage = Math.min(page, totalPages);

  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const visibleIds = visibleProducts
    .map(getProductId)
    .filter((id) => id != null);

  const selectedVisibleCount = visibleIds.filter((id) =>
    selected.includes(id),
  ).length;

  const allVisibleSelected =
    visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  function toggleSelected(id) {
    if (id == null) return;

    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleVisible() {
    setSelected((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return [...current, ...visibleIds.filter((id) => !current.includes(id))];
    });
  }

  function resetFilters() {
    setSearch("");
    setCategory("All");
    setSortBy("newest");
    setPage(1);
    setSelected([]);
  }

  async function deleteProduct(id) {
    if (!id) {
      setError("This product does not have a valid ID.");
      return;
    }

    if (
      !window.confirm(
        "Delete this product permanently? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingId(id);
    setError("");
    setNotice("");

    try {
      await api.delete(`/products/${id}`);

      setProducts((current) =>
        current.filter((product) => getProductId(product) !== id),
      );

      setSelected((current) => current.filter((item) => item !== id));
      setNotice("Product deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Product deletion failed.");
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteSelectedProducts() {
    if (selected.length === 0 || bulkDeleting) return;

    const confirmed = window.confirm(
      `Delete ${selected.length} selected product(s)? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setBulkDeleting(true);
    setError("");
    setNotice("");

    const deletedIds = [];
    const failedIds = [];

    for (const id of selected) {
      try {
        await api.delete(`/products/${id}`);
        deletedIds.push(id);
      } catch {
        failedIds.push(id);
      }
    }

    setProducts((current) =>
      current.filter((product) => !deletedIds.includes(getProductId(product))),
    );

    setSelected(failedIds);

    if (failedIds.length > 0) {
      setError(
        `${deletedIds.length} product(s) deleted. ${failedIds.length} could not be deleted.`,
      );
    } else {
      setNotice(`${deletedIds.length} product(s) deleted successfully.`);
    }

    setBulkDeleting(false);
  }

  function exportCSV() {
    if (filteredProducts.length === 0) {
      setError("There are no products to export.");
      return;
    }

    const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const headers = [
      "Product ID",
      "Name",
      "Brand",
      "Category",
      "Price",
      "Description",
    ];

    const rows = filteredProducts.map((product) => [
      getProductId(product),
      product.name,
      product.brand,
      product.category,
      product.price,
      product.description,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "ekart-product-catalogue.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const showReset = search !== "" || category !== "All" || sortBy !== "newest";

  return (
    <div className="min-h-screen space-y-7 bg-slate-50/70 p-4 text-slate-900 sm:p-6 xl:p-8">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-red-600">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            Store management
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Products
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Manage your product catalogue, descriptions, categories, pricing and
            product listings.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportCSV}
            disabled={loading || filteredProducts.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} />
            Export CSV
          </button>

          <Link
            to="/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:-translate-y-0.5 hover:bg-red-700"
          >
            <Plus size={18} />
            Add product
          </Link>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Catalogue overview */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total products"
          value={loading ? "—" : stats.total.toLocaleString("en-IN")}
          description="Listings in your catalogue"
          icon={Package}
          tone="red"
        />

        <StatCard
          title="Product categories"
          value={loading ? "—" : stats.categories.toLocaleString("en-IN")}
          description="Categories represented in your catalogue"
          icon={Tags}
          tone="blue"
        />

        <StatCard
          title="Combined listed prices"
          value={loading ? "—" : currency(stats.catalogueValue)}
          description="Sum of each product's listed price"
          icon={IndianRupee}
          tone="emerald"
        />

        <StatCard
          title="Products with pricing"
          value={loading ? "—" : stats.pricedProducts.toLocaleString("en-IN")}
          description="Listings with a recorded price"
          icon={CheckCircle2}
          tone="amber"
        />
      </section>

      {/* Catalogue search and filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search product, brand, category or ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-50"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex">
            <div className="relative">
              <Filter
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by category"
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-9 text-sm font-medium outline-none focus:border-red-400 xl:min-w-40"
              >
                <option value="All">All categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort products"
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium outline-none focus:border-red-400"
            >
              <option value="newest">Default order</option>
              <option value="name">Name: A–Z</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>

            <button
              type="button"
              onClick={loadProducts}
              disabled={loading}
              title="Reload products from backend"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            {loading
              ? "Loading catalogue..."
              : `Showing ${filteredProducts.length} of ${products.length} products`}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-slate-200 p-1">
              <button
                type="button"
                onClick={() => setView("table")}
                aria-label="Table view"
                title="Table view"
                className={`rounded-md p-2 ${
                  view === "table"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-label="Grid view"
                title="Grid view"
                className={`rounded-md p-2 ${
                  view === "grid"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            {showReset && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700"
              >
                <RotateCcw size={14} />
                Reset filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Bulk actions */}
      {selected.length > 0 && !loading && (
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center">
          <p className="text-sm font-bold text-red-800">
            {selected.length} product(s) selected
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelected([])}
              disabled={bulkDeleting}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-red-50"
            >
              Clear selection
            </button>

            <button
              type="button"
              onClick={deleteSelectedProducts}
              disabled={bulkDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 size={16} />
              {bulkDeleting ? "Deleting..." : "Delete selected"}
            </button>
          </div>
        </div>
      )}

      {/* Product catalogue */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-lg font-black">Product catalogue</h2>
            <p className="mt-1 text-xs text-slate-500">
              Manage listings, product information and pricing.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {loading ? "Syncing..." : "API catalogue"}
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8">
            <RefreshCw size={28} className="animate-spin text-red-600" />
            <p className="text-sm font-semibold text-slate-600">
              Loading your products...
            </p>
            <p className="text-xs text-slate-400">
              Connecting to your store API
            </p>
          </div>
        ) : error && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <span className="rounded-2xl bg-red-50 p-4 text-red-600">
              <Package size={28} />
            </span>
            <h3 className="mt-4 font-bold text-slate-900">
              Could not load catalogue
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Check that your backend is running and that GET /products returns
              the product list.
            </p>
            <button
              type="button"
              onClick={loadProducts}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <span className="rounded-2xl bg-slate-100 p-4 text-slate-500">
              <Package size={30} />
            </span>
            <h3 className="mt-4 font-bold text-slate-900">
              {products.length === 0
                ? "Your catalogue is empty"
                : "No matching products"}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {products.length === 0
                ? "Add your first product to start building your E-Kart catalogue."
                : "Try another search term or reset your filters."}
            </p>

            {products.length === 0 ? (
              <Link
                to="/products/new"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
              >
                <Plus size={17} />
                Add your first product
              </Link>
            ) : (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold hover:bg-slate-50"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : view === "table" ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-850px text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="w-12 px-5 py-4">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleVisible}
                        aria-label="Select products on this page"
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-red-600"
                      />
                    </th>
                    <th className="px-5 py-4 font-bold">Product</th>
                    <th className="px-5 py-4 font-bold">Category</th>
                    <th className="px-5 py-4 font-bold">
                      <span className="inline-flex items-center gap-1">
                        Price <ArrowUpDown size={13} />
                      </span>
                    </th>
                    <th className="px-5 py-4 font-bold">Description</th>
                    <th className="px-5 py-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleProducts.map((product) => {
                    const id = getProductId(product);

                    return (
                      <tr
                        key={id ?? product.name}
                        className={`transition hover:bg-slate-50/80 ${
                          selected.includes(id) ? "bg-red-50/40" : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selected.includes(id)}
                            onChange={() => toggleSelected(id)}
                            disabled={id == null}
                            aria-label={`Select ${product.name || "product"}`}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-red-600"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex min-w-56 items-center gap-3">
                            <ProductImage product={product} />
                            <div className="min-w-0">
                              <p className="max-w-64 truncate font-bold text-slate-900">
                                {product.name || "Unnamed product"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {product.brand || "E-Kart product"}
                              </p>
                              {id && (
                                <p className="mt-1 max-w-48 truncate font-mono text-[10px] text-slate-400">
                                  ID: {id}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                            {product.category || "Uncategorized"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                          {currency(product.price)}
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-56 truncate text-xs text-slate-500">
                            {product.description || "No description added"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {id != null ? (
                              <>
                                <Link
                                  to={`/products/${id}/edit`}
                                  title="Edit product"
                                  aria-label={`Edit ${product.name || "product"}`}
                                  className="rounded-xl border border-slate-200 p-2.5 text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
                                >
                                  <Pencil size={16} />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => deleteProduct(id)}
                                  disabled={deletingId === id || bulkDeleting}
                                  title="Delete product"
                                  aria-label={`Delete ${product.name || "product"}`}
                                  className="rounded-xl border border-slate-200 p-2.5 text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {deletingId === id ? (
                                    <RefreshCw
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Missing ID
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              page={page}
              setPage={setPage}
              filteredProducts={filteredProducts}
              pageSize={PAGE_SIZE}
            />
          </>
        ) : (
          <>
            <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visibleProducts.map((product) => {
                const id = getProductId(product);

                return (
                  <article
                    key={id ?? product.name}
                    className="flex flex-col rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <ProductImage product={product} large />
                      <input
                        type="checkbox"
                        checked={selected.includes(id)}
                        onChange={() => toggleSelected(id)}
                        disabled={id == null}
                        aria-label={`Select ${product.name || "product"}`}
                        className="mt-1 h-4 w-4 cursor-pointer accent-red-600"
                      />
                    </div>

                    <div className="mt-4 flex-1">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {product.category || "Uncategorized"}
                      </span>

                      <h3 className="mt-3 line-clamp-2 font-bold text-slate-900">
                        {product.name || "Unnamed product"}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {product.brand || "E-Kart product"}
                      </p>

                      <p className="mt-3 text-xl font-black text-slate-950">
                        {currency(product.price)}
                      </p>

                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                        {product.description || "No description added"}
                      </p>
                    </div>

                    <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                      {id != null && (
                        <>
                          <Link
                            to={`/products/${id}/edit`}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil size={15} />
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => deleteProduct(id)}
                            disabled={deletingId === id || bulkDeleting}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2.5 text-red-600 hover:bg-red-50 disabled:opacity-40"
                            aria-label={`Delete ${product.name || "product"}`}
                          >
                            {deletingId === id ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              page={page}
              setPage={setPage}
              filteredProducts={filteredProducts}
              pageSize={PAGE_SIZE}
            />
          </>
        )}
      </section>

      <p className="text-center text-xs text-slate-400">
        E-Kart Admin · Product catalogue management
      </p>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  setPage,
  filteredProducts,
  pageSize,
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs text-slate-500">
        Showing{" "}
        <span className="font-bold text-slate-800">
          {(currentPage - 1) * pageSize + 1}–
          {Math.min(currentPage * pageSize, filteredProducts.length)}
        </span>{" "}
        of{" "}
        <span className="font-bold text-slate-800">
          {filteredProducts.length}
        </span>{" "}
        products
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>

        <span className="min-w-24 text-center text-xs font-semibold text-slate-600">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() =>
            setPage((current) => Math.min(totalPages, current + 1))
          }
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
