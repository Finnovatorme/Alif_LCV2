import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import EventEmitter from "events";

export const eventEmitter = new EventEmitter();

const baseURL = process.env.NEXT_PUBLIC_API_BASE || ""; // ✅ client-safe env var

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// ✅ ADDED: Request interceptor to pull token before every request and prevent caching on GET
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const storedAuth = localStorage.getItem("authData");
      if (storedAuth) {
        try {
          const auth = JSON.parse(storedAuth);
          if (auth.token) {
            config.headers.Authorization = `Bearer ${auth.token}`;
          }
        } catch (e) {
          console.error("Error parsing authData from localStorage:", e);
        }
      }
    }

    // Bypass browser and proxy HTTP caches for GET requests
    if (config.method?.toLowerCase() === "get") {
      config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      config.headers["Pragma"] = "no-cache";
      config.headers["Expires"] = "0";
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) eventEmitter.emit("sessionExpired", "unauthorized");
    else if (status === 500) eventEmitter.emit("noNetwork", "noNetwork");

    // ✅ keep original error for debugging
    return Promise.reject(error);
  },
);

export default axiosInstance;
