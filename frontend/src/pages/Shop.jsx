import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductGrid from "../components/shop/ProductGrid";

const API_URL = `${import.meta.env.VITE_API_URL}/products`;

function getProductList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.products)) return response.products;
  if (Array.isArray(response?.data?.products)) {
    return response.data.products;
  }
  return [];
}

function getCategoryName(product) {
  const category = product.category;

  if (typeof category === "string") return category;
  if (category && typeof category === "object") {
    return category.name || category.title || "";
  }

  return "";
}

export default function Shop() {
  const [params] = useSearchParams();
  const [sort, setSort] = useState("featured");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const search = (params.get("search") || "").toLowerCase().trim();
  const category = params.get("category") || "";

  useEffect(() => {
    let active = true;

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`Products API returned ${response.status}`);
        }

        const data = await response.json();
        const list = getProductList(data);

        if (active) {
          setProducts(list);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);

        if (active) {
          setError(
            "Unable to load products. Please check that your backend is running.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchProducts();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      const name = product.name || product.title || "";
      const brand = product.brand || "";
      const productCategory = getCategoryName(product);

      const searchable = `${name} ${brand} ${productCategory}`.toLowerCase();

      const matchesSearch = searchable.includes(search);

      const matchesCategory =
        !category ||
        productCategory.toLowerCase().trim() === category.toLowerCase().trim();

      return matchesSearch && matchesCategory;
    });

    if (sort === "low") {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    if (sort === "high") {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    if (sort === "name") {
      result.sort((a, b) =>
        (a.name || a.title || "").localeCompare(b.name || b.title || ""),
      );
    }

    return result;
  }, [products, search, category, sort]);

  return (
    <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <p className="text-[10px] font-extrabold tracking-[0.2em] text-red-600">
        THE E-KART COLLECTION
      </p>

      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
        {category || (search ? `Search: ${search}` : "All electronics")}
      </h1>

      <p className="mt-3 text-sm text-gray-500">
        Explore mobiles, home appliances and everyday essentials.
      </p>

      <div className="my-8 flex flex-wrap items-center justify-between gap-3 border-y border-gray-100 py-4">
        <span className="text-xs text-gray-500">
          {loading ? "Loading products..." : `${filtered.length} products`}
        </span>

        <label className="flex items-center gap-2 text-xs text-gray-600">
          Sort by
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-blue-400"
          >
            <option value="featured">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p className="py-10 text-center text-gray-500">
          Loading products from E-KART...
        </p>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-5 text-center text-sm text-red-700">
          {error}
          <button
            onClick={() => window.location.reload()}
            className="ml-2 font-bold underline"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-gray-500">No products found.</p>
      ) : (
        <ProductGrid products={filtered} />
      )}
    </main>
  );
}
