import axios from "axios";

// Base URL fallback en mode test
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api"; // valeur pour Vitest

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// =======================
//  Interceptor Request
// =======================
axiosClient.interceptors.request.use((config) => {
  // Ne pas appliquer dans les tests
  if (import.meta.env.MODE === "test") return config;

  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =======================
//  Interceptor Response
// =======================
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // éviter redirect pendant les tests
    if (import.meta.env.MODE !== "test") {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

// =======================
//  Fonction logout
// =======================
axiosClient.logout = () => {
  return axiosClient.post("/logout");
};

export default axiosClient;
