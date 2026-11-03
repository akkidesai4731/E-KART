import axios from "axios";

const API_URL = "http://192.168.1.102:8000/api";

export const getAllCategories = async () => {
  const response = await axios.get(`${API_URL}/categories`);

  const body = response.data;

  // Supports common API response formats.
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.categories)) return body.categories;
  if (Array.isArray(body.data?.categories)) {
    return body.data.categories;
  }

  return [];
};
