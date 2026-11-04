import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
});

// Named export for ProductForm.jsx
export { api };

// Default export for other files that use import api from ...
export default api;
