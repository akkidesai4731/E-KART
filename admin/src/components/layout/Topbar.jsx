import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Bell,
  UserRound,
  Package,
  Users,
  ShoppingCart,
  Layers,
  LoaderCircle,
} from "lucide-react";
import api from "../../api/axios";

const searchSections = [
  {
    key: "products",
    label: "Products",
    endpoint: "/products",
    path: "/products",
    icon: Package,
    fields: ["name", "title", "brand", "category", "_id"],
  },
  {
    key: "categories",
    label: "Categories",
    endpoint: "/categories",
    path: "/categories",
    icon: Layers,
    fields: ["name", "title", "slug", "_id"],
  },
  {
    key: "customers",
    label: "Customers",
    endpoint: "/customers",
    path: "/customers",
    icon: Users,
    fields: ["name", "email", "phone", "_id"],
  },
  {
    key: "orders",
    label: "Orders",
    endpoint: "/orders",
    path: "/orders",
    icon: ShoppingCart,
    fields: ["orderNumber", "customerName", "status", "orderStatus", "_id"],
  },
];

function extractItems(response) {
  const body = response.data;

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.items)) return body.data.items;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.orders)) return body.orders;
  if (Array.isArray(body?.products)) return body.products;

  return [];
}

export default function Topbar() {
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const term = query.trim();

    if (!term) {
      setResults([]);
      setLoading(false);
      setSearchError("");
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearchError("");

      const responses = await Promise.allSettled(
        searchSections.map((section) =>
          api.get(section.endpoint, {
            params: { limit: 100 },
          }),
        ),
      );

      if (cancelled) return;

      const matches = [];
      let successfulSections = 0;

      responses.forEach((result, index) => {
        if (result.status !== "fulfilled") return;

        successfulSections++;

        const section = searchSections[index];
        const items = extractItems(result.value);

        items.forEach((item) => {
          const searchableText = section.fields
            .map((field) => item[field])
            .filter((value) => value !== undefined && value !== null)
            .join(" ")
            .toLowerCase();

          if (searchableText.includes(term.toLowerCase())) {
            matches.push({
              id: String(item._id || item.id || searchableText),
              section: section.label,
              path: section.path,
              icon: section.icon,
              title:
                item.name ||
                item.title ||
                item.orderNumber ||
                item.email ||
                `Record ${item._id || ""}`,
              subtitle:
                item.email ||
                item.category ||
                item.orderStatus ||
                item.status ||
                item.brand ||
                "",
            });
          }
        });
      });

      if (!cancelled) {
        setResults(matches.slice(0, 12));

        if (successfulSections === 0) {
          setSearchError("Could not connect to the search APIs.");
        }

        setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const openResult = (result) => {
    setOpen(false);
    setQuery("");
    navigate(result.path);
  };

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        setOpen(true);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="relative w-full max-w-xl">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-gray-400 focus-within:bg-white">
          {loading ? (
            <LoaderCircle className="h-5 w-5 animate-spin text-gray-500" />
          ) : (
            <Search className="h-5 w-5 text-gray-500" />
          )}

          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search products, customers, orders..."
            className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            aria-label="Search admin workspace"
            aria-expanded={open}
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                searchRef.current?.focus();
              }}
              className="rounded p-1 text-gray-500 hover:bg-gray-200"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}

          {!query && (
            <kbd className="hidden whitespace-nowrap rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500 sm:block">
              Ctrl K
            </kbd>
          )}
        </div>

        {open && query.trim() && (
          <div className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
            {loading && (
              <p className="p-4 text-center text-sm text-gray-500">
                Searching your store...
              </p>
            )}

            {!loading && searchError && (
              <p className="p-4 text-sm text-red-600">{searchError}</p>
            )}

            {!loading && !searchError && results.length === 0 && (
              <p className="p-4 text-center text-sm text-gray-500">
                No matching records found.
              </p>
            )}

            {!loading &&
              results.map((result) => {
                const Icon = result.icon;

                return (
                  <button
                    key={`${result.section}-${result.id}`}
                    type="button"
                    onClick={() => openResult(result)}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <Icon size={18} className="text-gray-700" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {result.title}
                      </span>

                      <span className="block truncate text-xs text-gray-500">
                        {result.section}
                        {result.subtitle ? ` · ${result.subtitle}` : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="rounded-xl p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
          aria-label="Admin settings"
        >
          <UserRound size={19} />
        </button>
      </div>
    </header>
  );
}
