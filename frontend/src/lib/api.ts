import axios from 'axios';

/**
 * Axios instance yang sudah dikonfigurasi untuk API backend.
 * Base URL mengarah ke Next.js rewrite proxy → Laravel API.
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// ── Request Interceptor: attach auth token ──
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: handle errors ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // Unauthorized — redirect ke login
      if (status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }

      // Forbidden
      if (status === 403) {
        console.error('Akses ditolak:', error.response.data.message);
      }

      // Validation error
      if (status === 422) {
        return Promise.reject(error.response.data);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
