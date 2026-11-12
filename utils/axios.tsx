import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import EventEmitter from "events";

export const eventEmitter = new EventEmitter();

const baseURL = process.env.NEXT_PUBLIC_API_BASE || ""; // ✅ client-safe env var

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Deduplicate simultaneous/burst identical GET requests across the app (e.g., StrictMode double-mounts)
const inFlightGets = new Map<string, Promise<AxiosResponse<any>>>();
const recentGetCache = new Map<string, { timestamp: number; response: AxiosResponse<any> }>();
const BURST_DEDUP_MS = 800;

const buildGetKey = (url: string, config?: AxiosRequestConfig): string => {
  let serializedParams = "";
  if (config?.params) {
    try {
      const sortedEntries = Object.entries(config.params)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b));
      serializedParams = JSON.stringify(sortedEntries);
    } catch {
      serializedParams = String(config.params);
    }
  }
  return `${url}?${serializedParams}`;
};

export const clearGetDedupCache = () => {
  recentGetCache.clear();
};

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

    const method = config.method?.toLowerCase();

    // Any mutating call clears recent GET burst cache so subsequent reads fetch fresh data
    if (method && method !== "get" && method !== "head" && method !== "options") {
      recentGetCache.clear();
    }

    // Bypass browser and proxy HTTP caches for GET requests
    if (method === "get") {
      config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      config.headers["Pragma"] = "no-cache";
      config.headers["Expires"] = "0";
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

// Wrap axiosInstance.get to coalesce in-flight and tight-burst duplicate GET requests
const originalGet = axiosInstance.get.bind(axiosInstance);
axiosInstance.get = function <T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  config?: AxiosRequestConfig<D>,
): Promise<R> {
  const key = buildGetKey(url, config);
  const bypass = Boolean((config?.headers as any)?.["X-Bypass-Dedup"]);

  if (!bypass) {
    const cached = recentGetCache.get(key);
    if (cached && Date.now() - cached.timestamp < BURST_DEDUP_MS) {
      return Promise.resolve(cached.response as unknown as R);
    }

    const existingPromise = inFlightGets.get(key);
    if (existingPromise) {
      return existingPromise as unknown as Promise<R>;
    }
  }

  const reqPromise = originalGet<T, R, D>(url, config)
    .then((res) => {
      recentGetCache.set(key, {
        timestamp: Date.now(),
        response: res as unknown as AxiosResponse<any>,
      });
      return res;
    })
    .finally(() => {
      inFlightGets.delete(key);
    });

  if (!bypass) {
    inFlightGets.set(key, reqPromise as unknown as Promise<AxiosResponse<any>>);
  }

  return reqPromise;
};

export default axiosInstance;
