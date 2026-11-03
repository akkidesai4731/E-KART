import Hero from "../components/home/Hero";
import CategoryGrid from "../components/home/CategoryGrid";
import FeaturedCarousel from "../components/home/FeaturedCarousel";
import ValueProps from "../components/home/ValueProps";

import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";

function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      {/* Hero banner */}
      <Hero />

      {/* Product categories */}
      <CategoryGrid />

      {/* Featured electronics */}
      <FeaturedCarousel />

      {/* Promotional banner */}
      <section className="relative mt-16 overflow-hidden rounded-3xl bg-gray-950 px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-red-600/20 blur-3xl" />

        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-red-400">
              <Zap size={15} />
              E-KART EVERYDAY ELECTRONICS
            </span>

            <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight sm:text-4xl">
              Good technology.
              <br />
              Better everyday living.
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-6 text-gray-400">
              Discover smartphones, kitchen appliances, home electronics and
              useful everyday essentials in one place.
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Explore products
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* Shopping benefits */}
      <ValueProps />

      {/* Bottom shopping call to action */}
      <section className="py-12 text-center sm:py-16">
        <p className="text-xs font-extrabold tracking-[0.2em] text-blue-600">
          YOUR HOME. YOUR TECHNOLOGY.
        </p>

        <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
          Find your next everyday essential.
        </h2>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-500">
          Browse our electronics collection and compare product specifications
          before adding items to your cart.
        </p>

        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold transition hover:border-red-600 hover:text-red-600"
        >
          Shop all electronics
          <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}
export default Home;
