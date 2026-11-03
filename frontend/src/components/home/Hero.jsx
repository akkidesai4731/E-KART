import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Truck, Zap, ArrowRight } from "lucide-react";

const slides = [
  {
    id: "essentials",
    eyebrow: "SMARTER EVERYDAY SHOPPING",
    title: "Upgrade your everyday",
    highlight: "life.",
    description:
      "Discover mobiles, home appliances and everyday electronics designed to make life simpler.",
    category: "All Products",
    link: "/shop",
    label: "Everyday essentials",
    sublabel: "Everything in one place",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=85",
    alt: "Electronics and accessories on a desk",
    background: "from-gray-100 via-slate-100 to-blue-100",
  },
  {
    id: "mobiles",
    eyebrow: "SMARTER CONNECTIVITY",
    title: "Meet your next",
    highlight: "smartphone.",
    description:
      "Explore smartphones with beautiful displays, powerful cameras and modern features.",
    category: "Mobiles",
    link: "/shop?category=Mobiles",
    label: "Smartphone collection",
    sublabel: "Find your next upgrade",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85",
    alt: "Smartphone product photography",
    background: "from-blue-50 via-gray-100 to-indigo-100",
  },
  {
    id: "home",
    eyebrow: "COMFORT STARTS AT HOME",
    title: "Make your home",
    highlight: "smarter.",
    description:
      "Discover home appliances designed to make cooking, cleaning and everyday living easier.",
    category: "Home Appliances",
    link: "/shop?category=Home Appliances",
    label: "Home appliance picks",
    sublabel: "Comfort meets convenience",
    image:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=85",
    alt: "Modern home kitchen",
    background: "from-orange-50 via-gray-100 to-rose-100",
  },
  {
    id: "audio",
    eyebrow: "YOUR SOUND. YOUR WORLD.",
    title: "Feel every",
    highlight: "beat.",
    description:
      "Explore headphones and audio essentials for music, work and entertainment.",
    category: "Audio",
    link: "/shop?category=Audio",
    label: "Audio essentials",
    sublabel: "Bring your music to life",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85",
    alt: "Headphones product photography",
    background: "from-purple-50 via-gray-100 to-blue-100",
  },
  {
    id: "laptops",
    eyebrow: "POWER YOUR POTENTIAL",
    title: "Work smarter.",
    highlight: "Go further.",
    description:
      "Discover laptops and technology for learning, productivity and entertainment.",
    category: "Laptops",
    link: "/shop?category=Laptops",
    label: "Laptop collection",
    sublabel: "Ready for what's next",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=85",
    alt: "Laptop on a workspace",
    background: "from-cyan-50 via-gray-100 to-slate-200",
  },
];

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="px-3 pb-6 pt-4 sm:px-6 lg:px-8 lg:pt-7">
      <div
        className={`relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-linear-to-br ${activeSlide.background}`}
      >
        {/* Soft background decoration */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-red-200/25 blur-3xl" />

        <div className="relative grid min-h-490px items-center gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:min-h-535px lg:grid-cols-2 lg:gap-12 lg:px-14 lg:py-12">
          {/* Text content */}
          <div key={activeSlide.id} className="hero-content order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/90 px-3.5 py-2 text-[10px] font-extrabold tracking-[0.12em] text-red-600 shadow-sm sm:text-xs">
              <Zap size={14} />
              {activeSlide.eyebrow}
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-black leading-[1.08] tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
              {activeSlide.title}{" "}
              <span className="text-red-600">{activeSlide.highlight}</span>
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-7 text-gray-600 sm:text-base sm:leading-8">
              {activeSlide.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                to={activeSlide.link}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-red-700"
              >
                Explore products
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-medium text-gray-600">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-600" />
                Clear product details
              </span>

              <span className="inline-flex items-center gap-2">
                <Truck size={16} className="text-blue-600" />
                Delivery options
              </span>
            </div>
          </div>

          {/* Product/category image */}
          <div
            key={`${activeSlide.id}-image`}
            className="hero-image order-1 min-w-0 lg:order-2"
          >
            <Link
              to={activeSlide.link}
              className="group relative block overflow-hidden rounded-2xl bg-white/70 shadow-xl shadow-gray-900/10"
              aria-label={`Explore ${activeSlide.category}`}
            >
              <img
                src={activeSlide.image}
                alt={activeSlide.alt}
                className="h-240px w-full object-cover sm:h-310px lg:h-355px"
                loading="eager"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    "https://placehold.co/1200x800/f3f4f6/374151?text=E-kart";
                }}
              />

              <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />

              <div className="absolute bottom-4 left-4 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-lg sm:bottom-5 sm:left-5">
                <p className="text-sm font-extrabold text-gray-950">
                  {activeSlide.label}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {activeSlide.sublabel}
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Minimal slide indicators: no navigation buttons */}
        <div className="relative flex items-center justify-center gap-2 pb-6">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${slide.category} slide`}
              aria-current={activeIndex === index ? "true" : undefined}
              className={`h-2 rounded-full transition-all duration-700 ease-in-out ${
                activeIndex === index
                  ? "w-8 bg-red-600"
                  : "w-2 bg-gray-400/50 hover:bg-gray-500"
              }`}
            />
          ))}
        </div>
      </div>

      <style>{`
        .hero-content {
          animation: heroContentFade 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .hero-image {
          animation: heroImageFade 1100ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes heroContentFade {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroImageFade {
          from {
            opacity: 0.55;
            transform: translateX(16px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-content,
          .hero-image {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
