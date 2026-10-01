import axios from 'axios';
import toast from 'react-hot-toast';
import { getAccessToken, setAccessToken, clearTokens } from '../utils/authStorage';

// The API is reached through the SAME ORIGIN on purpose.
//
//   dev  -> vite.config.js proxies '/api' to http://localhost:5000
//   prod -> client/vercel.json rewrites '/api/*' to the API project
//
// Going same-origin removes CORS, cross-site cookie/SameSite problems, and
// makes the client immune to a stale VITE_API_URL baked into the build (a
// dead API host in that variable silently breaks every request).
//
// If you ever MUST talk to the API cross-origin (e.g. a mobile app or a
// separate API domain), opt in explicitly with VITE_USE_DIRECT_API=true.
const DIRECT_API = import.meta.env.VITE_USE_DIRECT_API === 'true';

export const baseURL = (() => {
  if (!DIRECT_API) return '/api';

  let v = (import.meta.env.VITE_API_URL || '').trim();
  while (v.endsWith('/')) v = v.slice(0, -1);
  if (!v) return '/api';
  if (v === '/api' || v.endsWith('/api')) return v;
  return `${v}/api`;
})();

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach the active access token (per-tab session, or the
// remembered persistent one from localStorage)
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle errors, auto refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    // Don't retry for login/register/refresh endpoints
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register') || originalRequest?.url?.includes('/auth/refresh');

    // A cold Vercel instance answers 503 DB_NOT_READY while Atlas connects. The
    // server rejects those in dbReady, BEFORE any route handler runs, so no
    // side effects happened and retrying is safe even for POST/PATCH/DELETE.
    const isDbNotReady = status === 503 && error?.response?.data?.code === 'DB_NOT_READY';
    const dbRetries = originalRequest._dbRetries || 0;
    if (isDbNotReady && dbRetries < 3) {
      originalRequest._dbRetries = dbRetries + 1;
      await new Promise((r) => setTimeout(r, 800 * (dbRetries + 1)));
      return api(originalRequest);
    }

    // Retry transient NETWORK failures (ECONNRESET / socket hang up / timeout).
    // These happen regularly because the API is reached through the Vercel
    // rewrite and a function can be recycled mid-flight. No request status
    // means the server never answered, so nothing was processed — safe to retry.
    const netRetries = originalRequest._netRetries || 0;
    const isTransientNetworkError = !status && ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'EPIPE'].some((c) => String(error?.code || error?.message || '').includes(c));
    if (isTransientNetworkError && netRetries < 2) {
      originalRequest._netRetries = netRetries + 1;
      await new Promise((r) => setTimeout(r, 600 * (netRetries + 1)));
      return api(originalRequest);
    }

    // Only try to refresh/rotate the session if we actually hold credentials.
    // A 401 with no stored token just means the user is browsing as a guest —
    // forcing a hard redirect to /login would break all public pages.
    const hadToken = !!getAccessToken();

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint && hadToken) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken }, { withCredentials: true });
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        // Only redirect if not already on an auth page
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          toast.error('Session expired. Please log in again.');
          setTimeout(() => (window.location.href = '/login'), 800);
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Format error message
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong. Please try again.';

    // Dedupe network-error toasts: Home fires featured+categories in
    // parallel, so one outage = one toast, not a stack of identical red bars.
    // Global 5s window shared across all concurrent requests.
    if (!status) {
      const now = Date.now();
      if (now - (window.__lastNetworkToastAt || 0) < 5000) {
        return Promise.reject(error?.response?.data || { message });
      }
      window.__lastNetworkToastAt = now;
    }

    // Show toast for client errors (but not 401 handled above)
    if (status && status >= 400 && status !== 401) {
      toast.error(message);
    } else if (!status) {
      toast.error('Network error. Check your connection.');
    }

    return Promise.reject(error?.response?.data || { message });
  },
);

export default api;
