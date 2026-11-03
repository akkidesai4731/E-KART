import ProductCard from "../product/ProductCard";

export default function ProductGrid({ products = [] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 px-5 py-16 text-center">
        <h3 className="text-lg font-bold">No products found</h3>
        <p className="mt-2 text-sm text-gray-500">
          Try another search or select a different category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id || product.id} product={product} />
      ))}
    </div>
  );
}
