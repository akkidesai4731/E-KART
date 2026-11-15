import { useMemo } from "react";
import { Image as ImageIcon } from "lucide-react";

/**
 * Responsive product image gallery.
 *
 * Desktop: Flipkart-style two-column image grid.
 * Mobile/tablet: one large selected image with a horizontal thumbnail strip.
 *
 * Props:
 * - images: array of image URLs
 * - activeImage: currently selected image URL
 * - onImageSelect: callback when an image is selected
 * - productName: accessible image description
 */
export default function ProductGallery({
  images = [],
  activeImage = "",
  onImageSelect,
  productName = "Product",
}) {
  const validImages = useMemo(
    () => [...new Set((Array.isArray(images) ? images : []).filter(Boolean))],
    [images],
  );

  const selectedImage = validImages.includes(activeImage)
    ? activeImage
    : validImages[0] || "";

  const selectImage = (image) => {
    if (typeof onImageSelect === "function") onImageSelect(image);
  };

  const imageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src =
      "https://placehold.co/900x900/f5f5f5/777777?text=Image+Unavailable";
  };

  if (!validImages.length) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <ImageIcon size={42} />
          <span className="text-sm">Product image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      {/* Mobile and tablet gallery */}
      <div className="lg:hidden">
        <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white p-3 sm:aspect-[5/4] sm:p-5">
          <img
            key={selectedImage}
            src={selectedImage}
            alt={`${productName} product image`}
            draggable="false"
            onError={imageError}
            className="block h-full w-full select-none object-contain object-center"
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
          <span className="absolute bottom-2 right-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-600 shadow">
            {validImages.indexOf(selectedImage) + 1} / {validImages.length}
          </span>
        </div>

        {validImages.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {validImages.map((image, index) => {
              const selected = selectedImage === image;

              return (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => selectImage(image)}
                  aria-label={`View product image ${index + 1}`}
                  aria-pressed={selected}
                  className={`h-[68px] w-[68px] shrink-0 overflow-hidden rounded-lg border-2 bg-white p-1 transition sm:h-20 sm:w-20 ${
                    selected
                      ? "border-red-500"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    draggable="false"
                    onError={imageError}
                    className="block h-full w-full object-contain"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop: Flipkart-style image tiles */}
      <div className="hidden grid-cols-2 items-start gap-2.5 lg:grid xl:gap-3">
        {validImages.slice(0, 4).map((image, index) => {
          const selected = selectedImage === image;

          return (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => selectImage(image)}
              aria-label={`Select product image ${index + 1}`}
              aria-pressed={selected}
              className={`group relative flex aspect-[4/5] min-w-0 items-center justify-center overflow-hidden rounded-xl border bg-white p-2 transition xl:p-3 ${
                selected
                  ? "border-gray-300"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <img
                src={image}
                alt={`${productName} view ${index + 1}`}
                loading={index < 2 ? "eager" : "lazy"}
                draggable="false"
                onError={imageError}
                className="block h-full w-full object-contain object-center"
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              />
              {selected && (
                <span className="absolute bottom-2 left-2 rounded bg-white/95 px-2 py-1 text-[10px] font-semibold text-gray-600 shadow-sm">
                  Selected
                </span>
              )}
            </button>
          );
        })}

        {validImages.length > 4 && (
          <div className="col-span-2 flex gap-2 overflow-x-auto pb-1">
            {validImages.slice(4).map((image, index) => (
              <button
                key={`${image}-extra-${index}`}
                type="button"
                onClick={() => selectImage(image)}
                aria-label={`Select additional product image ${index + 5}`}
                className={`h-[76px] w-[76px] shrink-0 overflow-hidden rounded-lg border-2 bg-white p-1 ${
                  selectedImage === image ? "border-red-500" : "border-gray-200"
                }`}
              >
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  onError={imageError}
                  className="block h-full w-full object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-3 hidden text-center text-xs text-gray-400 lg:block">
        {validImages.length} product image{validImages.length === 1 ? "" : "s"}
        <span className="mx-1">•</span>
        Select an image to view
      </p>
    </div>
  );
}
