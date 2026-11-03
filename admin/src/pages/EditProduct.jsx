import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  LoaderCircle,
  Image as ImageIcon,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.1.102:8000";

const initialForm = {
  name: "",
  brand: "",
  category: "",
  price: "",
  stock: "",
  image: "",
  description: "",
};

const categories = [
  "Mobiles",
  "Laptops",
  "Televisions",
  "Audio",
  "Refrigerators",
  "Cooling",
  "Home Appliances",
  "Kitchen Appliances",
  "Accessories",
  "Other",
];

function getProductFromResponse(data) {
  // Supports common API response formats.
  return data?.data?.product || data?.data || data?.product || data;
}

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/products/${id}`);

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to load product.");
        }

        const product = getProductFromResponse(result);

        if (!product || (!product._id && !product.id)) {
          throw new Error(
            "Product not found. Check the API response and product ID.",
          );
        }

        setForm({
          name: product.name || "",
          brand: product.brand || "",
          category: product.category || "",
          price: product.price ?? "",
          stock: product.stock ?? "",
          image: product.image || product.imageUrl || product.images?.[0] || "",
          description: product.description || "",
        });
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    } else {
      setError("Product ID is missing from the URL.");
      setLoading(false);
    }
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.name.trim() ||
      !form.category ||
      form.price === "" ||
      form.stock === ""
    ) {
      setError("Please enter the product name, category, price, and stock.");
      return;
    }

    if (Number(form.price) < 0 || Number(form.stock) < 0) {
      setError("Price and stock cannot be negative.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        image: form.image.trim(),
        description: form.description.trim(),
      };

      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update product.");
      }

      setSuccess("Product updated successfully!");

      // Change this path if your product list uses another route.
      setTimeout(() => navigate("/products"), 1000);
    } catch (err) {
      setError(err.message || "Unable to update product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-gray-600">
        <LoaderCircle className="animate-spin" size={22} />
        Loading product details...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 text-gray-900 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/products")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
        >
          <ArrowLeft size={18} />
          Back to Products
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="mt-2 text-gray-500">
            Update the product information for your store.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold">Product Information</h2>

              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium"
                >
                  Product Name *
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  placeholder="Enter product name"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="brand"
                    className="mb-2 block text-sm font-medium"
                  >
                    Brand
                  </label>
                  <input
                    id="brand"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    placeholder="e.g. Samsung"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="mb-2 block text-sm font-medium"
                  >
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="price"
                    className="mb-2 block text-sm font-medium"
                  >
                    Price (₹) *
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    placeholder="Enter price"
                  />
                </div>

                <div>
                  <label
                    htmlFor="stock"
                    className="mb-2 block text-sm font-medium"
                  >
                    Stock Quantity *
                  </label>
                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    placeholder="Enter stock quantity"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  value={form.description}
                  onChange={handleChange}
                  className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  placeholder="Describe the product..."
                />
              </div>
            </section>

            <aside className="h-fit space-y-5 rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Product Image</h2>

              <label htmlFor="image" className="mb-2 block text-sm font-medium">
                Image URL
              </label>
              <input
                id="image"
                name="image"
                type="url"
                value={form.image}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-black"
                placeholder="https://example.com/image.jpg"
              />

              <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3">
                {form.image ? (
                  <img
                    src={form.image}
                    alt={form.name || "Product preview"}
                    className="max-h-64 w-full object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    onLoad={(event) => {
                      event.currentTarget.style.display = "block";
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon size={36} className="mx-auto mb-2" />
                    <p className="text-sm">No image added</p>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Current product price</p>
                <p className="mt-1 text-2xl font-bold">
                  ₹{Number(form.price || 0).toLocaleString("en-IN")}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Stock: {form.stock || 0}
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/products")}
                className="w-full rounded-lg border border-gray-300 px-5 py-3 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
}
