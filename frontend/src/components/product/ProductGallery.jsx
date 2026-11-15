import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductGallery({
  images = [],
  activeImage,
  onImageSelect,
  productName = "Product",
}) {
  const validImages = [
    ...new Set(
      images
        .filter((image) => typeof image === "string")
        .map((image) => image.trim())
        .filter(Boolean),
    ),
  ].slice(0, 10);

  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    const image = validImages.includes(activeImage)
      ? activeImage
      : validImages[0] || "";

    setSelectedImage(image);
  }, [activeImage, images]);

  const changeImage = (image) => {
    setSelectedImage(image);
    onImageSelect?.(image);
  };

  const scrollThumbnails = (direction) => {
    const container = document.getElementById("product-image-thumbnails");

    if (container) {
      container.scrollBy({
        left: direction * 220,
        behavior: "smooth",
      });
    }
  };

  if (!validImages.length) {
    return (
      <div className="w-full h-[350px] flex items-center justify-center bg-gray-100 rounded-xl">
        <span className="text-gray-400">No product image available</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main Product Image */}
      <div className="w-full h-[320px] sm:h-[420px] lg:h-[500px] bg-white border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
        <img
          src={selectedImage || validImages[0]}
          alt={productName}
          className="w-full h-full object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      {/* Horizontal Scroll Thumbnails */}
      <div className="relative mt-4">
        {/* Left Scroll Button */}
        {validImages.length > 4 && (
          <button
            type="button"
            onClick={() => scrollThumbnails(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md border rounded-full w-9 h-9 flex items-center justify-center"
            aria-label="Scroll images left"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <div
          id="product-image-thumbnails"
          className="flex gap-3 overflow-x-auto scroll-smooth px-11 pb-3"
          style={{
            scrollbarWidth: "thin",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {validImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => changeImage(image)}
              className={`flex-shrink-0 w-[75px] h-[75px] sm:w-[90px] sm:h-[90px] rounded-lg border-2 overflow-hidden bg-white ${
                selectedImage === image
                  ? "border-blue-600"
                  : "border-gray-200 hover:border-gray-400"
              }`}
              aria-label={`View product image ${index + 1}`}
            >
              <img
                src={image}
                alt={`${productName} ${index + 1}`}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>

        {/* Right Scroll Button */}
        {validImages.length > 4 && (
          <button
            type="button"
            onClick={() => scrollThumbnails(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md border rounded-full w-9 h-9 flex items-center justify-center"
            aria-label="Scroll images right"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center mt-1">
        {validImages.indexOf(selectedImage) + 1} of {validImages.length} images
      </p>
    </div>
  );
}
