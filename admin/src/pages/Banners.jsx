import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  RefreshCw,
  Image as ImageIcon,
  Eye,
  X,
  Check,
  AlertCircle,
  CheckCircle2,
  Megaphone,
  CalendarDays,
  ArrowUpDown,
  ExternalLink,
  Power,
} from "lucide-react";
import api from "../api/axios.js";

function getId(banner) {
  return banner._id || banner.id;
}

function getTitle(banner) {
  return banner.title || "Untitled banner";
}

function getImage(banner) {
  return banner.imageUrl || banner.image || "";
}

function isBannerActive(banner) {
  if (typeof banner.isActive === "boolean") return banner.isActive;
  if (typeof banner.active === "boolean") return banner.active;
  return true;
}

function getDate(banner) {
  const value = banner.createdAt || banner.updatedAt;
  if (!value) return "Date unavailable";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
          <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
        </div>
        <span className={`rounded-xl p-3 ${color}`}>
          <Icon size={22} />
        </span>
      </div>
    </div>
  );
}

export default function Banners() {
  const [banners, setBanners] = useState([]);

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageErrors, setImageErrors] = useState({});

  const loadBanners = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const { data } = await api.get("/banners");

      const result = Array.isArray(data)
        ? data
        : Array.isArray(data?.banners)
          ? data.banners
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.data?.banners)
              ? data.data.banners
              : [];

      setBanners(result);
      setImageErrors({});
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load banners. Check your backend API route.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const stats = useMemo(
    () => ({
      total: banners.length,
      active: banners.filter(isBannerActive).length,
      inactive: banners.filter((banner) => !isBannerActive(banner)).length,
    }),
    [banners],
  );

  const filteredBanners = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...banners]
      .filter((banner) => getTitle(banner).toLowerCase().includes(query))
      .sort((a, b) => {
        if (sortOrder === "az") {
          return getTitle(a).localeCompare(getTitle(b));
        }

        if (sortOrder === "za") {
          return getTitle(b).localeCompare(getTitle(a));
        }

        const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();

        return sortOrder === "oldest" ? dateA - dateB : dateB - dateA;
      });
  }, [banners, search, sortOrder]);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setTitle("");
    setImageUrl("");
    setIsActive(true);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessages();

    const cleanTitle = title.trim();
    const cleanImageUrl = imageUrl.trim();

    if (!cleanTitle) {
      setError("Please enter a banner title.");
      return;
    }

    if (cleanTitle.length > 100) {
      setError("The banner title must be 100 characters or fewer.");
      return;
    }

    try {
      const parsedUrl = new URL(cleanImageUrl);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        setError("Please enter a valid HTTP or HTTPS image URL.");
        return;
      }
    } catch {
      setError("Please enter a valid image URL.");
      return;
    }

    const duplicate = banners.some(
      (banner) =>
        getId(banner) !== editingId &&
        getTitle(banner).toLowerCase() === cleanTitle.toLowerCase(),
    );

    if (duplicate) {
      setError("A banner with this title already exists.");
      return;
    }

    setSaving(true);

    const payload = {
      title: cleanTitle,
      imageUrl: cleanImageUrl,
      isActive,
    };

    try {
      if (editingId) {
        // Requires PUT /banners/:id on the backend.
        await api.put(`/banners/${editingId}`, payload);
        setSuccess(`"${cleanTitle}" was updated successfully.`);
      } else {
        await api.post("/banners", payload);
        setSuccess(`"${cleanTitle}" was added successfully.`);
      }

      resetForm();
      await loadBanners(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (editingId
            ? "Could not update the banner. Check your backend update route."
            : "Could not save the banner. Check your backend API."),
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(banner) {
    clearMessages();
    setEditingId(getId(banner));
    setTitle(getTitle(banner));
    setImageUrl(getImage(banner));
    setIsActive(isBannerActive(banner));

    document
      .getElementById("banner-editor")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function deleteBanner(banner) {
    const id = getId(banner);

    if (!id) {
      setError("This banner does not have a valid ID.");
      return;
    }

    if (
      !window.confirm(`Delete "${getTitle(banner)}"? This cannot be undone.`)
    ) {
      return;
    }

    clearMessages();
    setDeletingId(id);

    try {
      await api.delete(`/banners/${id}`);

      setBanners((current) => current.filter((item) => getId(item) !== id));

      if (editingId === id) resetForm();

      setSuccess(`"${getTitle(banner)}" was deleted.`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete this banner.");
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleBanner(banner) {
    const id = getId(banner);

    if (!id) {
      setError("This banner does not have a valid ID.");
      return;
    }

    const nextActive = !isBannerActive(banner);

    clearMessages();
    setTogglingId(id);

    try {
      // Requires PUT /banners/:id to accept the isActive field.
      await api.put(`/banners/${id}`, { isActive: nextActive });

      setBanners((current) =>
        current.map((item) =>
          getId(item) === id
            ? {
                ...item,
                isActive: nextActive,
                active: nextActive,
              }
            : item,
        ),
      );

      setSuccess(
        `"${getTitle(banner)}" is now ${nextActive ? "active" : "inactive"}.`,
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not change banner status. Check your backend update route.",
      );
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="min-h-screen space-y-7 bg-slate-50/70 p-1 sm:p-2">
      {/* Header */}
      <section className="flex flex-col justify-between gap-5 rounded-3xl bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-lg sm:p-8 lg:flex-row lg:items-center">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-200">
            <Megaphone size={17} />
            E-KART ADMINISTRATION
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Banners & Promotions
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Manage promotional artwork and campaigns for your electronics store.
            Preview your banners before adding them to your catalog.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadBanners(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold transition hover:bg-white/20 disabled:opacity-50 lg:self-center"
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh banners"}
        </button>
      </section>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            className="ml-auto text-red-600 hover:text-red-900"
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
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <p>{success}</p>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
            className="ml-auto text-emerald-700 hover:text-emerald-900"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total banners"
          value={loading ? "—" : stats.total}
          subtitle="Promotional banners stored"
          icon={ImageIcon}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Active banners"
          value={loading ? "—" : stats.active}
          subtitle="Marked as active"
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Inactive banners"
          value={loading ? "—" : stats.inactive}
          subtitle="Marked as inactive"
          icon={Power}
          color="bg-amber-50 text-amber-700"
        />
      </section>

      {/* Form and live preview */}
      <section
        id="banner-editor"
        className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="mb-5">
          <h2 className="text-xl font-black text-slate-950">
            {editingId ? "Edit banner" : "Create a banner"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add a title and an image URL to prepare your promotion.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="banner-title"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Banner title
              </label>
              <input
                id="banner-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Festive Electronics Sale"
                maxLength={100}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {title.length}/100 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="banner-image"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Image URL
              </label>
              <input
                id="banner-image"
                value={imageUrl}
                onChange={(event) => {
                  setImageUrl(event.target.value);
                  setImageErrors((current) => ({
                    ...current,
                    preview: false,
                  }));
                }}
                type="url"
                placeholder="https://example.com/banner.jpg"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                Use a publicly accessible HTTPS image URL. This form does not
                upload files directly.
              </p>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Active promotion
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Mark this banner as active when saving.
                </p>
              </div>

              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-5 w-5 accent-blue-600"
              />
            </label>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="submit"
                disabled={saving || !title.trim() || !imageUrl.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw size={17} className="animate-spin" />
                ) : editingId ? (
                  <Check size={17} />
                ) : (
                  <Plus size={18} />
                )}
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add banner"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <X size={17} />
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          {/* Preview */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
              <Eye size={17} />
              Live preview
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {imageUrl.trim() && !imageErrors.preview ? (
                <img
                  src={imageUrl}
                  alt={title.trim() || "Banner preview"}
                  onError={() =>
                    setImageErrors((current) => ({
                      ...current,
                      preview: true,
                    }))
                  }
                  onLoad={() =>
                    setImageErrors((current) => ({
                      ...current,
                      preview: false,
                    }))
                  }
                  className="aspect-16/7 w-full object-cover"
                />
              ) : (
                <div className="flex aspect-16/7 flex-col items-center justify-center gap-3 bg-linear-to-br from-slate-100 to-indigo-50 text-slate-400">
                  <ImageIcon size={36} />
                  <p className="text-sm font-medium">
                    {imageUrl.trim()
                      ? "Image could not be loaded"
                      : "Your image preview will appear here"}
                  </p>
                </div>
              )}

              <div className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">
                      {title.trim() || "Your banner title"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Promotional banner
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner library */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Banner library
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading banners..."
                : `Showing ${filteredBanners.length} of ${banners.length} banners`}
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
                placeholder="Search banners..."
                aria-label="Search banners"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setSortOrder((current) => {
                  const options = ["newest", "oldest", "az", "za"];
                  return options[
                    (options.indexOf(current) + 1) % options.length
                  ];
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowUpDown size={16} />
              {sortOrder === "newest"
                ? "Newest"
                : sortOrder === "oldest"
                  ? "Oldest"
                  : sortOrder === "az"
                    ? "A to Z"
                    : "Z to A"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-14 text-slate-500">
            <RefreshCw size={28} className="animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading banners...</p>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <div className="rounded-2xl bg-slate-100 p-5 text-slate-400">
              <ImageIcon size={32} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              {banners.length === 0 ? "No banners yet" : "No matching banners"}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {banners.length === 0
                ? "Create your first promotional banner using the form above."
                : "Try another search term to find your banner."}
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
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
            {filteredBanners.map((banner) => {
              const id = getId(banner);
              const image = getImage(banner);
              const active = isBannerActive(banner);
              const imageFailed = imageErrors[id];

              return (
                <article
                  key={id || getTitle(banner)}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="relative aspect-[16/9 overflow-hidden bg-slate-100">
                    {image && !imageFailed ? (
                      <img
                        src={image}
                        alt={getTitle(banner)}
                        loading="lazy"
                        onError={() =>
                          setImageErrors((current) => ({
                            ...current,
                            [id]: true,
                          }))
                        }
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                        <ImageIcon size={32} />
                        <span className="text-xs">Image unavailable</span>
                      </div>
                    )}

                    <span
                      className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${
                        active
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-800 text-white"
                      }`}
                    >
                      {active ? "Active" : "Inactive"}
                    </span>

                    {image && !imageFailed && (
                      <a
                        href={image}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open image for ${getTitle(banner)}`}
                        title="Open image"
                        className="absolute right-3 top-3 rounded-lg bg-black/50 p-2 text-white transition hover:bg-black/75"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>

                  <div className="space-y-4 p-4">
                    <div>
                      <h3 className="truncate font-bold text-slate-900">
                        {getTitle(banner)}
                      </h3>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays size={14} />
                        {getDate(banner)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => startEditing(banner)}
                        disabled={!id || saving || togglingId !== null}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBanner(banner)}
                        disabled={!id || togglingId !== null || saving}
                        title={active ? "Deactivate banner" : "Activate banner"}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition disabled:opacity-40 ${
                          active
                            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {togglingId === id ? (
                          <RefreshCw size={15} className="animate-spin" />
                        ) : (
                          <Power size={15} />
                        )}
                        {active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteBanner(banner)}
                        disabled={!id || deletingId !== null || saving}
                        aria-label={`Delete ${getTitle(banner)}`}
                        title="Delete banner"
                        className="rounded-xl border border-red-200 p-2.5 text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                      >
                        {deletingId === id ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && banners.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs text-slate-500 sm:px-6">
            Banner images are loaded from their saved URLs. Only banners marked
            active should be displayed by your storefront backend.
          </div>
        )}
      </section>
    </div>
  );
}
