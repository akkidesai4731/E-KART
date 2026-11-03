import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

export default function ProductGallery({ product }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [startX, setStartX] = useState(null);

  // Support both string URLs and image objects
  const images = product?.images?.length
    ? product.images
    : product?.imageUrl || product?.image
      ? [product.imageUrl || product.image]
      : [];

  const getUrl = (item) => {
    if (typeof item === "string") return item;
    return item?.url || item?.imageUrl || "";
  };

  const getLabel = (item, index) =>
    typeof item === "string"
      ? `View ${index + 1}`
      : item?.label || `View ${index + 1}`;

  // Reset active image when a different product is opened
  useEffect(() => {
    setActiveIndex(0);
  }, [product?._id, product?.id]);

  // Keep index valid if images change
  useEffect(() => {
    if (activeIndex >= images.length) {
      setActiveIndex(0);
    }
  }, [images.length, activeIndex]);

  const previous = () => {
    if (images.length > 1) {
      setActiveIndex((index) => (index - 1 + images.length) % images.length);
    }
  };

  const next = () => {
    if (images.length > 1) {
      setActiveIndex((index) => (index + 1) % images.length);
    }
  };

  const handlePointerDown = (event) => {
    setStartX(event.clientX);
  };

  const handlePointerUp = (event) => {
    if (startX === null) return;

    const distance = event.clientX - startX;

    if (distance > 40) previous();
    if (distance < -40) next();

    setStartX(null);
  };

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src =
      "https://placehold.co/800x800/f5f5f5/555555?text=Image+Unavailable";
  };

  if (!images.length) {
    return (
      <div
        className="flex aspect-square w-full items-center justify-center
        overflow-hidden rounded-2xl border border-gray-200 bg-white"
      >
        <img
          src="https://placehold.co/800x800/f5f5f5/555555?text=No+Product+Image"
          alt="Product unavailable"
          className="h-full w-full object-contain p-8"
        />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      {/* Main product image */}
      <div
        className="relative flex aspect-square w-full items-center
          justify-center overflow-hidden rounded-2xl border
          border-gray-200 bg-white"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setStartX(null)}
        style={{ touchAction: "pan-y" }}
      >
        <img
          key={getUrl(images[activeIndex])}
          src={getUrl(images[activeIndex])}
          alt={`${product?.name || "Product"} - ${getLabel(
            images[activeIndex],
            activeIndex,
          )}`}
          draggable="false"
          onError={handleImageError}
          className="block h-full w-full select-none object-contain
            object-center p-3 sm:p-5 md:p-7"
        />

        {/* Previous button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={previous}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 z-10 grid h-9 w-9
              -translate-y-1/2 place-items-center rounded-full
              border border-gray-200 bg-white/95 text-gray-800
              shadow-md transition hover:bg-gray-100 sm:left-3
              sm:h-10 sm:w-10"
          >
            <ChevronLeft size={21} />
          </button>
        )}

        {/* Next button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={next}
            aria-label="Next image"
            className="absolute right-2 top-1/2 z-10 grid h-9 w-9
              -translate-y-1/2 place-items-center rounded-full
              border border-gray-200 bg-white/95 text-gray-800
              shadow-md transition hover:bg-gray-100 sm:right-3
              sm:h-10 sm:w-10"
          >
            <ChevronRight size={21} />
          </button>
        )}

        {/* Image counter */}
        <span
          className="absolute bottom-3 right-3 rounded-full
            bg-white/95 px-3 py-1.5 text-xs font-semibold
            text-gray-700 shadow"
        >
          {activeIndex + 1} / {images.length}
        </span>
      </div>

      {/* Helper text */}
      <div
        className="mt-3 flex items-center justify-center gap-2
        text-xs text-gray-500"
      >
        <RotateCw size={14} />
        <span>Select an image or swipe to browse</span>
      </div>

      {/* Thumbnail gallery */}
      <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
        {images.map((item, index) => {
          const selected = activeIndex === index;

          return (
            <button
              key={`${getUrl(item)}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Select ${getLabel(item, index)}`}
              aria-pressed={selected}
              className={`group flex aspect-square min-w-0
                items-center justify-center overflow-hidden
                rounded-2xl border-2 bg-white p-1
                transition-all duration-200 sm:p-1.5 ${
                  selected
                    ? "border-blue-600 shadow-sm"
                    : "border-gray-200 hover:border-gray-400"
                }`}
            >
              <img
                src={getUrl(item)}
                alt={getLabel(item, index)}
                loading="lazy"
                draggable="false"
                onError={handleImageError}
                className="block h-full w-full rounded-xl
                  object-contain object-center"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
