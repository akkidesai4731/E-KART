import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "https://e-kart-2ijq.onrender.com/api",
  timeout: 30000,
});

export { api };
export default api;
