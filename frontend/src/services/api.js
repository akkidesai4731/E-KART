const API_URL = import.meta.env.VITE_API_URL || "http://192.168.1.102:8000/api";

export async function getProducts() {
  const response = await fetch(`${API_URL}/products`);

  if (!response.ok) {
    throw new Error("Unable to load products from the server");
  }

  return response.json();
}
