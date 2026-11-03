import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  RefreshCw,
  Tags,
  Check,
  X,
  Package,
  AlertCircle,
  FolderOpen,
  ArrowUpDown,
  CheckCircle2,
} from "lucide-react";
import api from "../api/axios.js";

function getId(category) {
  return category._id || category.id;
}

function getName(category) {
  return category.name || category.title || "Unnamed category";
}

function getProductCount(category) {
  return Number(
    category.productCount ??
      category.productsCount ??
      category.products?.length ??
      0,
  );
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("az");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCategories = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const { data } = await api.get("/categories");

      const result = Array.isArray(data)
        ? data
        : Array.isArray(data?.categories)
          ? data.categories
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.data?.categories)
              ? data.data.categories
              : [];

      setCategories(result);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load categories. Check your backend API route.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories
      .filter((category) => getName(category).toLowerCase().includes(query))
      .sort((a, b) => {
        if (sortOrder === "za") {
          return getName(b).localeCompare(getName(a));
        }

        if (sortOrder === "products") {
          return getProductCount(b) - getProductCount(a);
        }

        return getName(a).localeCompare(getName(b));
      });
  }, [categories, search, sortOrder]);

  const stats = useMemo(
    () => ({
      total: categories.length,
      products: categories.reduce(
        (sum, category) => sum + getProductCount(category),
        0,
      ),
      named: categories.filter(
        (category) => getName(category) !== "Unnamed category",
      ).length,
    }),
    [categories],
  );

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  async function addCategory(event) {
    event.preventDefault();
    clearMessages();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter a category name.");
      return;
    }

    if (trimmedName.length > 50) {
      setError("Category names must be 50 characters or fewer.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        getName(category).toLowerCase() === trimmedName.toLowerCase(),
    );

    if (duplicate) {
      setError("A category with this name already exists.");
      return;
    }

    setAdding(true);

    try {
      await api.post("/categories", { name: trimmedName });
      setName("");
      setSuccess(`"${trimmedName}" category added successfully.`);
      await loadCategories(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create category.");
    } finally {
      setAdding(false);
    }
  }

  function startEditing(category) {
    clearMessages();
    setEditingId(getId(category));
    setEditName(getName(category));
  }

  async function saveEdit(id) {
    clearMessages();

    const trimmedName = editName.trim();

    if (!trimmedName) {
      setError("Category name cannot be empty.");
      return;
    }

    if (trimmedName.length > 50) {
      setError("Category names must be 50 characters or fewer.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        getId(category) !== id &&
        getName(category).toLowerCase() === trimmedName.toLowerCase(),
    );

    if (duplicate) {
      setError("Another category already uses this name.");
      return;
    }

    setSavingEdit(true);

    try {
      // Assumes your backend supports PUT /categories/:id.
      await api.put(`/categories/${id}`, { name: trimmedName });

      setEditingId(null);
      setEditName("");
      setSuccess("Category updated successfully.");
      await loadCategories(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not update category. Check that your backend supports PUT /categories/:id.",
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteCategory(category) {
    const id = getId(category);

    if (!id) {
      setError("This category does not have a valid ID.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${getName(category)}"?\n\nThis action may affect products assigned to this category.`,
    );

    if (!confirmed) return;

    clearMessages();
    setDeletingId(id);

    try {
      await api.delete(`/categories/${id}`);

      setCategories((current) => current.filter((item) => getId(item) !== id));

      if (editingId === id) {
        setEditingId(null);
        setEditName("");
      }

      setSuccess(`"${getName(category)}" was deleted.`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete category. It may be assigned to existing products.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen space-y-7 bg-slate-50/70 p-1 sm:p-2">
      {/* Header */}
      <section className="flex flex-col justify-between gap-5 rounded-3xl bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-lg sm:p-8 lg:flex-row lg:items-center">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-200">
            <Tags size={17} />
            E-KART ADMINISTRATION
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Categories
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Organize your electronics store, manage product categories, and keep
            your catalog easy to navigate.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadCategories(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold transition hover:bg-white/20 disabled:opacity-50 lg:self-center"
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 shrink-0" size={19} />
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto text-red-600 hover:text-red-900"
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 shrink-0" size={19} />
          <p>{success}</p>
          <button
            type="button"
            onClick={() => setSuccess("")}
            className="ml-auto text-emerald-700 hover:text-emerald-900"
            aria-label="Dismiss success message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total categories
            </p>
            <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <Tags size={21} />
            </span>
          </div>
          <p className="mt-4 text-3xl font-black text-slate-950">
            {loading ? "—" : stats.total}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Categories in your catalog
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Assigned products
            </p>
            <span className="rounded-xl bg-violet-50 p-3 text-violet-700">
              <Package size={21} />
            </span>
          </div>
          <p className="mt-4 text-3xl font-black text-slate-950">
            {loading ? "—" : stats.products}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Based on product counts returned by the API
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Named categories
            </p>
            <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <FolderOpen size={21} />
            </span>
          </div>
          <p className="mt-4 text-3xl font-black text-slate-950">
            {loading ? "—" : stats.named}
          </p>
          <p className="mt-1 text-xs text-slate-500">Categories with a name</p>
        </div>
      </section>

      {/* Add category */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-black text-slate-950">Add a category</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create a category to organize products in your store.
          </p>
        </div>

        <form
          onSubmit={addCategory}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="min-w-0 flex-1">
            <label
              htmlFor="category-name"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Category name
            </label>
            <input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Smartphones, Laptops, Audio"
              maxLength={50}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            <p className="mt-1.5 text-right text-xs text-slate-400">
              {name.length}/50 characters
            </p>
          </div>

          <div className="sm:self-start sm:pt-7">
            <button
              type="submit"
              disabled={adding || !name.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {adding ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Plus size={18} />
              )}
              {adding ? "Adding..." : "Add category"}
            </button>
          </div>
        </form>
      </section>

      {/* Category list */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Your categories
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading categories..."
                : `${filteredCategories.length} of ${categories.length} categories`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative sm:w-64">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories..."
                aria-label="Search categories"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setSortOrder((current) =>
                  current === "az"
                    ? "za"
                    : current === "za"
                      ? "products"
                      : "az",
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowUpDown size={16} />
              {sortOrder === "az"
                ? "A to Z"
                : sortOrder === "za"
                  ? "Z to A"
                  : "Most products"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-14 text-slate-500">
            <RefreshCw size={27} className="animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <div className="rounded-2xl bg-slate-100 p-5 text-slate-400">
              <FolderOpen size={32} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              {categories.length === 0
                ? "No categories yet"
                : "No categories found"}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {categories.length === 0
                ? "Add your first category using the form above."
                : "Try another search term or clear your search."}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCategories.map((category, index) => {
              const id = getId(category);
              const categoryName = getName(category);
              const productCount = getProductCount(category);
              const isEditing = editingId === id;
              const isDeleting = deletingId === id;

              return (
                <div
                  key={id || categoryName}
                  className="flex flex-col gap-4 p-4 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-blue-50 to-indigo-100 text-blue-700">
                      <Tags size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            autoFocus
                            value={editName}
                            onChange={(event) =>
                              setEditName(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                saveEdit(id);
                              }
                              if (event.key === "Escape") {
                                setEditingId(null);
                                setEditName("");
                              }
                            }}
                            maxLength={50}
                            aria-label="Edit category name"
                            className="min-w-0 rounded-lg border border-blue-300 px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveEdit(id)}
                              disabled={savingEdit}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <Check size={15} />
                              {savingEdit ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditName("");
                              }}
                              disabled={savingEdit}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="truncate font-bold text-slate-900">
                            {categoryName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Category #{index + 1}
                            <span className="mx-2">•</span>
                            {productCount}{" "}
                            {productCount === 1 ? "product" : "products"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-2 sm:shrink-0">
                      <span className="mr-auto rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 sm:mr-2">
                        {productCount} products
                      </span>

                      <button
                        type="button"
                        onClick={() => startEditing(category)}
                        disabled={!id || deletingId !== null}
                        aria-label={`Edit ${categoryName}`}
                        title="Edit category"
                        className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteCategory(category)}
                        disabled={!id || deletingId !== null}
                        aria-label={`Delete ${categoryName}`}
                        title="Delete category"
                        className="rounded-xl border border-slate-200 p-2.5 text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isDeleting ? (
                          <RefreshCw size={17} className="animate-spin" />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && categories.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs text-slate-500 sm:px-6">
            Manage your product categories here. Category and product counts
            depend on the information provided by your backend API.
          </div>
        )}
      </section>
    </div>
  );
}
