import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.1.102:8000/api",
  timeout: 30000,
});

// Named export for ProductForm.jsx
export { api };

// Default export for other files that use import api from ...
export default api;
