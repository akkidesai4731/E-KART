import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ProductGrid from "../shop/ProductGrid";

const API_URL = "http://192.168.1.102:8000/api/products";

function getProductList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.products)) return response.products;
  if (Array.isArray(response?.data?.products)) {
    return response.data.products;
  }
  return [];
}

export default function FeaturedCarousel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchProducts() {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`Products API returned ${response.status}`);
        }

        const data = await response.json();

        if (active) {
          setProducts(getProductList(data));
        }
      } catch (err) {
        console.error("Failed to load featured products:", err);

        if (active) {
          setError("Unable to load popular products.");
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

  return (
    <section className="mt-16 sm:mt-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.2em] text-red-600">
            POPULAR PICKS
          </p>

          <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Popular right now
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Explore electronics for home, work and daily life.
          </p>
        </div>

        <Link
          to="/shop"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-red-600"
        >
          View all <ArrowRight size={15} />
        </Link>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500">
          Loading popular products...
        </p>
      ) : error ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : products.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          No products available yet.
        </p>
      ) : (
        <ProductGrid products={products.slice(0, 4)} />
      )}
    </section>
  );
}
