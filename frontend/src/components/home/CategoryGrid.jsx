import { useEffect, useState } from "react";

import {
  Smartphone,
  Refrigerator,
  Tv,
  WashingMachine,
  Wind,
  CookingPot,
  House,
  Lightbulb,
  ArrowUpRight,
  Laptop,
  Watch,
  Headphones,
  Sparkles,
} from "lucide-react";

import { Link } from "react-router-dom";
import { categories as categoryDetails } from "../../data/categories";

const API_URL = "http://192.168.1.102:8000/api/categories";

const iconMap = {
  Smartphone,
  Refrigerator,
  Tv,
  WashingMachine,
  Wind,
  CookingPot,
  House,
  Lightbulb,
  Laptop,
  Watch,
  Headphones,
};

const fallback = {
  icon: Sparkles,
  description: "Explore our latest collection",
  image:
    "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=85",
  color: "bg-gray-50",
};

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-");
}

function getDetails(category) {
  const slug = normalize(category.slug || "");
  const name = normalize(category.name || category.title || "");

  const aliases = {
    tv: "televisions",
    television: "televisions",
    "smart-watch": "smart-watches",
    "bluetooth-earphone": "bluetooth-earphones",
    headphones: "bluetooth-earphones",
    laptop: "laptops",
    refrigerator: "refrigerators",
    "washing-machine": "washing-machines",
    "home-appliance": "home-appliances",
    "kitchen-appliance": "kitchen-appliances",
  };

  const normalizedSlug = aliases[slug] || slug;
  const normalizedName = aliases[name] || name;

  const details = categoryDetails.find(
    (item) => item.slug === normalizedSlug || item.slug === normalizedName,
  );

  if (!details) return fallback;

  return {
    ...details,
    icon: iconMap[details.icon] || Sparkles,
  };
}

function extractCategories(responseData) {
  if (Array.isArray(responseData)) return responseData;

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.categories)) {
    return responseData.categories;
  }

  if (Array.isArray(responseData?.data?.categories)) {
    return responseData.data.categories;
  }

  return [];
}

export default function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`Categories API returned ${response.status}`);
        }

        const result = await response.json();
        const categoryList = extractCategories(result);

        if (active) {
          setCategories(
            categoryList.filter(
              (category) => category && (category.name || category.title),
            ),
          );
        }
      } catch (err) {
        console.error("Failed to load categories:", err);

        if (active) {
          setError("Categories could not be loaded. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCategories();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mt-16 sm:mt-20 lg:mt-24">
      {/* SECTION HEADER */}

      <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-extrabold tracking-widest text-red-600">
            <Sparkles size={15} />
            SHOP YOUR WAY
          </div>

          <h2 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
            Explore our <span className="text-red-600">categories</span>
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">
            Discover technology, home essentials and everyday products selected
            to make life simpler.
          </p>
        </div>

        <Link
          to="/shop"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-800 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          View all products
          <ArrowUpRight size={18} />
        </Link>
      </div>

      {/* LOADING */}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="min-h-60 animate-pulse rounded-3xl bg-gray-100"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          {error}
          <button
            onClick={() => window.location.reload()}
            className="ml-3 font-bold underline"
          >
            Reload page
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 p-8 text-center">
          <h3 className="font-bold text-gray-900">No categories found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Add categories through the admin panel and verify your categories
            API.
          </p>
        </div>
      ) : (
        /* CATEGORY CARDS */

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          {categories.map((category) => {
            const details = getDetails(category);
            const Icon = details.icon;

            const categoryName = category.name || category.title;

            const categorySlug = category.slug || normalize(categoryName);

            return (
              <Link
                key={category._id || category.id || categorySlug}
                to={`/shop?category=${encodeURIComponent(categoryName)}`}
                className={`group relative flex min-h-245px items-center overflow-hidden rounded-3xl border border-gray-100 ${details.color} shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/70 sm:min-h-275px lg:min-h-300px`}
              >
                {/* LEFT CONTENT */}

                <div className="relative z-10 w-[58%] py-7 pl-5 pr-1 sm:py-8 sm:pl-7 lg:pl-8">
                  <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-white text-gray-900 shadow-sm transition duration-300 group-hover:bg-red-600 group-hover:text-white">
                    <Icon size={25} strokeWidth={1.8} />
                  </span>

                  <h3 className="text-xl font-extrabold leading-tight tracking-tight text-gray-950 sm:text-2xl">
                    {categoryName}
                  </h3>

                  <p className="mt-2 max-w-190px text-sm leading-6 text-gray-600">
                    {details.description}
                  </p>

                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-red-600 transition-all duration-300 group-hover:gap-3">
                    Shop now
                    <ArrowUpRight size={17} />
                  </span>
                </div>

                {/* RIGHT CATEGORY IMAGE */}

                <div className="absolute inset-y-0 right-0 w-[48%] overflow-hidden">
                  <img
                    src={details.image}
                    alt={categoryName}
                    loading="lazy"
                    className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = fallback.image;
                    }}
                  />

                  <div className="absolute inset-0 bg-linear-to-r from-white/50 via-transparent to-transparent" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* BOTTOM BANNER */}

      <div className="mt-8 flex flex-col gap-4 rounded-3xl bg-gray-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7">
        <div>
          <p className="text-lg font-extrabold sm:text-xl">
            Your next favourite is waiting.
          </p>

          <p className="mt-2 text-sm text-gray-300">
            Explore the E-kart collection and find what you need.
          </p>
        </div>

        <Link
          to="/shop"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-red-700"
        >
          Start shopping
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </section>
  );
}
