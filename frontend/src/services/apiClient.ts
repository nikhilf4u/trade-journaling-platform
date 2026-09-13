import axios from 'axios';

/**
 * Central axios instance.
 *
 * - In dev: Vite proxies /api/* → localhost:8080 (gateway)
 * - In prod: Nginx proxies /api/* → api-gateway container
 * - In external backend: set VITE_API_URL=https://api.example.com
 *
 * The /api prefix is added here ONCE. Callers use short paths like '/auth/login'.
 */
const EXTERNAL_URL = import.meta.env.VITE_API_URL || '';
const baseURL = EXTERNAL_URL ? `${EXTERNAL_URL}/api` : '/api';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ============================================================
// Request interceptor — attach JWT
// ============================================================
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tradeToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// Response interceptor — auto-logout on 401
// ============================================================
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Skip redirect if already on login page
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('tradeToken');
        localStorage.removeItem('tradeUser');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;