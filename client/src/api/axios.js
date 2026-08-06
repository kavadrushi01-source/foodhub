import axios from 'axios';
import toast from 'react-hot-toast';
import { getAccessToken, setAccessToken, clearTokens } from '../utils/authStorage';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000,
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
